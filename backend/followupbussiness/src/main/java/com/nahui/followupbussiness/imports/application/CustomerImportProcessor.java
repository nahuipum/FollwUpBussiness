package com.nahui.followupbussiness.imports.application;

import com.nahui.followupbussiness.customers.application.CheckCustomerDuplicatesService;
import com.nahui.followupbussiness.customers.application.CreateCustomerService;
import com.nahui.followupbussiness.customers.domain.GeoPoint;
import com.nahui.followupbussiness.identityaccess.domain.model.AuthenticatedActor;
import com.nahui.followupbussiness.identityaccess.domain.model.BaseRole;
import com.nahui.followupbussiness.imports.application.port.out.CustomerImportStore;

import java.io.*;
import java.nio.charset.*;
import java.util.*;
import java.util.zip.*;
import javax.xml.stream.*;

import org.springframework.transaction.annotation.Transactional;

/**
 * Processes only an atomically claimed job; row evidence contains codes, never customer values.
 */
public class CustomerImportProcessor {
    private static final List<String> HEADERS = List.of("name", "address", "latitude", "longitude", "documentType", "documentNumber", "phone", "email", "segment", "visitFrequencyDays", "territoryId");
    private final CustomerImportStore imports;
    private final CreateCustomerService customers;
    private final CheckCustomerDuplicatesService duplicates;

    public CustomerImportProcessor(CustomerImportStore imports, CreateCustomerService customers, CheckCustomerDuplicatesService duplicates) {
        this.imports = imports;
        this.customers = customers;
        this.duplicates = duplicates;
    }

    @Transactional
    public void process(UUID id, UUID tenant) {
        var claimed = imports.claim(id, tenant);
        if (claimed.isEmpty()) return;
        var job = claimed.get().job();
        List<CustomerImportStore.RowError> errors = new ArrayList<>();
        List<Row> rows;
        try {
            rows = parse(job.contentType(), claimed.get().contents());
        } catch (RuntimeException ex) {
            imports.recordRowErrors(id, List.of(new CustomerImportStore.RowError(1, "INVALID_TEMPLATE")));
            imports.complete(id, null, 0, 1, true, com.nahui.followupbussiness.imports.domain.CustomerImport.FailureReason.INVALID_TEMPLATE);
            return;
        }
        var actor = new AuthenticatedActor(job.requestedBy(), job.tenantId(), BaseRole.COMPANY_ADMIN);
        List<Command> valid = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (Row row : rows)
            try {
                Command c = command(row);
                String key = (c.name() + "|" + c.address() + "|" + c.documentNumber() + "|" + c.phone()).toLowerCase(Locale.ROOT);
                if (!seen.add(key) || duplicates.check(new CheckCustomerDuplicatesService.Command(c.name(), c.documentNumber(), c.phone(), c.address(), c.location(), null), actor).hasPossibleDuplicates())
                    throw new IllegalArgumentException("DUPLICATE");
                valid.add(c);
            } catch (Exception e) {
                errors.add(new CustomerImportStore.RowError(row.number, code(e)));
            }
        if (!job.partialAcceptance() && !errors.isEmpty()) {
            imports.recordRowErrors(id, errors);
            imports.complete(id, rows.size(), 0, errors.size(), false, null);
            return;
        }
        int accepted = 0;
        for (Command c : valid)
            try {
                customers.create(new CreateCustomerService.Command(c.name(), c.documentType(), c.documentNumber(), c.phone(), c.email(), c.segment(), c.address(), c.location(), c.frequency(), c.territory()), actor);
                accepted++;
            } catch (Exception e) {
                errors.add(new CustomerImportStore.RowError(c.row(), code(e)));
            }
        imports.recordRowErrors(id, errors);
        imports.complete(id, rows.size(), accepted, errors.size(), false, null);
    }

    @Transactional
    public Optional<com.nahui.followupbussiness.imports.domain.CustomerImport> failAfterDeliveryExhausted(UUID id, UUID tenant) {
        return imports.fail(id, tenant);
    }

    private static String code(Exception e) {
        return e instanceof CreateCustomerService.InvalidTerritory ? "INVALID_TERRITORY" : e.getMessage() != null && e.getMessage().equals("DUPLICATE") ? "DUPLICATE" : "INVALID_ROW";
    }

    private static Command command(Row r) {
        List<String> c = r.cells;
        if (c.size() != HEADERS.size()) throw new IllegalArgumentException();
        for (String x : c) if (x.length() > 512) throw new IllegalArgumentException();
        return new Command(r.number, required(c, 0), optional(c, 4), optional(c, 5), optional(c, 6), optional(c, 7), optional(c, 8), required(c, 1), new GeoPoint(Double.parseDouble(required(c, 2)), Double.parseDouble(required(c, 3))), integer(c, 9), uuid(c, 10));
    }

    private static String required(List<String> c, int i) {
        String x = optional(c, i);
        if (x == null) throw new IllegalArgumentException();
        return x;
    }

    private static String optional(List<String> c, int i) {
        String x = c.get(i).trim();
        return x.isEmpty() ? null : x;
    }

    private static Integer integer(List<String> c, int i) {
        String x = optional(c, i);
        return x == null ? null : Integer.valueOf(x);
    }

    private static UUID uuid(List<String> c, int i) {
        String x = optional(c, i);
        return x == null ? null : UUID.fromString(x);
    }

    private static List<Row> parse(String type, byte[] b) {
        if (b.length > 10 * 1024 * 1024) throw new IllegalArgumentException();
        return type.toLowerCase(Locale.ROOT).startsWith("text/csv") ? csv(b) : xlsx(b);
    }

    private static List<Row> csv(byte[] b) {
        String s = new String(b, StandardCharsets.UTF_8);
        if (s.indexOf('\uFFFD') >= 0 || !s.startsWith("# template-version: 1.0")) throw new IllegalArgumentException();
        List<Row> result = new ArrayList<>();
        String[] lines = s.replace("\r", "").split("\n");
        if (lines.length < 2 || !HEADERS.equals(List.of(lines[1].split(",", -1)))) throw new IllegalArgumentException();
        for (int i = 2; i < lines.length; i++) if (!lines[i].isBlank()) result.add(new Row(i + 1, split(lines[i])));
        limit(result);
        return result;
    }

    private static List<String> split(String s) {
        List<String> r = new ArrayList<>();
        StringBuilder v = new StringBuilder();
        boolean q = false;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\"') {
                if (q && i + 1 < s.length() && s.charAt(i + 1) == '\"') {
                    v.append(c);
                    i++;
                } else q = !q;
            } else if (c == ',' && !q) {
                r.add(v.toString());
                v.setLength(0);
            } else v.append(c);
        }
        if (q) throw new IllegalArgumentException();
        r.add(v.toString());
        return r;
    }

    private static List<Row> xlsx(byte[] b) {
        try {
            List<Row> out = new ArrayList<>();
            int sheets = 0;
            boolean templateVersion = false;
            try (ZipInputStream z = new ZipInputStream(new ByteArrayInputStream(b))) {
                ZipEntry e;
                long uncompressed = 0;
                byte[] data = new byte[8192];
                while ((e = z.getNextEntry()) != null) {
                    if (e.getName().contains("vbaProject") || e.getName().contains(".."))
                        throw new IllegalArgumentException();
                    ByteArrayOutputStream o = new ByteArrayOutputStream();
                    int n;
                    while ((n = z.read(data)) > 0) {
                        uncompressed += n;
                        if (uncompressed > 20L * Math.max(1, b.length) || uncompressed > 20 * 1024 * 1024)
                            throw new IllegalArgumentException();
                        o.write(data, 0, n);
                    }
                    byte[] entry = o.toByteArray();
                    if (e.getName().matches("xl/worksheets/[^/]+\\.xml")) {
                        sheets++;
                        readSheet(entry, out);
                    } else if ("docProps/custom.xml".equals(e.getName())) templateVersion = hasTemplateVersion(entry);
                }
            }
            if (sheets != 1 || !templateVersion || out.isEmpty() || !HEADERS.equals(out.removeFirst().cells))
                throw new IllegalArgumentException();
            limit(out);
            return out;
        } catch (IOException | XMLStreamException e) {
            throw new IllegalArgumentException();
        }
    }

    private static boolean hasTemplateVersion(byte[] b) throws XMLStreamException {
        XMLStreamReader r = secureXml(b);
        boolean template = false;
        while (r.hasNext()) {
            int e = r.next();
            if (e == XMLStreamConstants.START_ELEMENT && "property".equals(r.getLocalName()))
                template = "TemplateVersion".equals(r.getAttributeValue(null, "name"));
            else if (template && e == XMLStreamConstants.CHARACTERS && "1.0".equals(r.getText().trim())) return true;
            else if (e == XMLStreamConstants.END_ELEMENT && "property".equals(r.getLocalName())) template = false;
        }
        return false;
    }

    private static void readSheet(byte[] b, List<Row> out) throws XMLStreamException {
        XMLStreamReader r = secureXml(b);
        List<String> cells = null;
        int row = 0;
        while (r.hasNext()) {
            int e = r.next();
            if (e == XMLStreamConstants.START_ELEMENT && "row".equals(r.getLocalName())) {
                cells = new ArrayList<>();
                row = Integer.parseInt(r.getAttributeValue(null, "r"));
            } else if (e == XMLStreamConstants.START_ELEMENT && "t".equals(r.getLocalName()) && cells != null)
                cells.add(r.getElementText());
            else if (e == XMLStreamConstants.END_ELEMENT && "row".equals(r.getLocalName()))
                out.add(new Row(row, cells));
        }
    }

    private static XMLStreamReader secureXml(byte[] b) throws XMLStreamException {
        XMLInputFactory f = XMLInputFactory.newFactory();
        f.setProperty(XMLInputFactory.SUPPORT_DTD, false);
        f.setProperty("javax.xml.stream.isSupportingExternalEntities", false);
        return f.createXMLStreamReader(new ByteArrayInputStream(b));
    }

    private static void limit(List<Row> r) {
        if (r.size() > 10000) throw new IllegalArgumentException();
    }

    private record Row(int number, List<String> cells) {
    }

    private record Command(int row, String name, String documentType, String documentNumber, String phone, String email,
                           String segment, String address, GeoPoint location, Integer frequency, UUID territory) {
    }
}
