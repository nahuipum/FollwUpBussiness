param(
    [ValidateRange(30, 300)]
    [int]$TimeoutSeconds = 180,
    [ValidatePattern('^fieldsales-be055-e2e-[a-z0-9-]+$')]
    [string]$ProjectName = "fieldsales-be055-e2e-$PID"
)

if (-not $env:FIELD_SALES_SECURITY_LOCAL_SECRET) {
    $env:FIELD_SALES_SECURITY_LOCAL_SECRET = "e2e-$(New-Guid)-security-secret"
}
if (-not $env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD = "e2e-$(New-Guid)" }
if (-not $env:REDIS_PASSWORD) { $env:REDIS_PASSWORD = "e2e-$(New-Guid)" }
if (-not $env:RABBITMQ_PASSWORD) { $env:RABBITMQ_PASSWORD = "e2e-$(New-Guid)" }

# Avoid host-port and named-volume collisions with the developer's Compose project.
$env:POSTGRES_PORT = 15432
$env:REDIS_PORT = 16379
$env:RABBITMQ_AMQP_PORT = 15673
$env:RABBITMQ_MANAGEMENT_PORT = 25672

function Invoke-Compose {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    & docker compose -p $ProjectName @Arguments
}

try {
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    Invoke-Compose up --build -d backend prometheus
    if ($LASTEXITCODE -ne 0) { throw 'Compose could not start the isolated observability scenario.' }

    do {
        $backendTarget = $null
        $targetsJson = Invoke-Compose exec -T prometheus wget -qO- http://localhost:9090/api/v1/targets
        if ($LASTEXITCODE -eq 0) {
            $targets = $targetsJson | ConvertFrom-Json
            $backendTarget = $targets.data.activeTargets | Where-Object { $_.labels.job -eq 'fieldsales-backend' }
        }
        if ($backendTarget -and $backendTarget.health -eq 'up') {
            break
        }
        Start-Sleep -Seconds 2
    } while ((Get-Date) -lt $deadline)

    if (-not $backendTarget -or $backendTarget.health -ne 'up') {
        throw 'Prometheus target fieldsales-backend did not become UP.'
    }

    $series = Invoke-Compose exec -T prometheus wget -qO- 'http://localhost:9090/api/v1/query?query=outbox_publish_failures_total' | ConvertFrom-Json
    if ($series.status -ne 'success' -or @($series.data.result).Count -lt 1) {
        throw 'Prometheus did not expose outbox_publish_failures_total.'
    }

    Invoke-Compose --profile e2e run --rm observability-probe wget -qO- --timeout=3 http://backend:9091/actuator/prometheus
    if ($LASTEXITCODE -eq 0) {
        throw 'An infrastructure-network probe reached the management endpoint.'
    }

    $rules = Invoke-Compose exec -T prometheus wget -qO- http://localhost:9090/api/v1/rules
    if ($rules -notmatch 'FieldSalesOutboxPublishFailures') {
        throw 'Prometheus did not load the outbox publication-failures rule.'
    }

    Write-Output 'PASS: fieldsales-backend is UP; the outbox series and rule are available; the infrastructure probe is denied.'
} finally {
    Invoke-Compose down --volumes
}
