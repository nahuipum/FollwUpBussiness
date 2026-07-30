package com.nahui.followupbussiness.routing;

import com.google.ortools.Loader;
import com.google.ortools.constraintsolver.Assignment;
import com.google.ortools.constraintsolver.FirstSolutionStrategy;
import com.google.ortools.constraintsolver.LocalSearchMetaheuristic;
import com.google.ortools.constraintsolver.RoutingDimension;
import com.google.ortools.constraintsolver.RoutingIndexManager;
import com.google.ortools.constraintsolver.RoutingModel;
import com.google.ortools.constraintsolver.RoutingSearchParameters;
import com.google.protobuf.Duration;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import static com.google.ortools.constraintsolver.main.defaultRoutingSearchParameters;
import static org.assertj.core.api.Assertions.assertThat;

class OrToolsRouteModelTest {

    @BeforeAll
    static void loadNativeLibrary() {
        Loader.loadNativeLibraries();
    }

    @Test
    void supportsDistinctEndpointsWindowsServicePriorityAndInfeasibility() {
        long[][] travel = {
                {0, 2, 2, 6},
                {2, 0, 4, 2},
                {2, 4, 0, 2},
                {6, 2, 2, 0}
        };
        ModelResult result = solve(travel, new long[]{0, 2, 2, 0},
                new long[][]{{0, 6}, {0, 5}, {0, 5}, {0, 6}},
                new long[]{0, 10_000, 100, 0}, 200, false);

        assertThat(result.solutionFound()).isTrue();
        assertThat(result.route()).startsWith(0).endsWith(3).contains(1).doesNotContain(2);
        assertThat(result.dropped()).containsExactly(2);
        assertThat(result.endTime()).isEqualTo(6);
    }

    @Test
    void sameMatrixAndConfigurationProduceSameOrder() {
        long[][] travel = sequentialMatrix(11);
        long[][] windows = broadWindows(11, 200);
        long[] services = new long[11];
        java.util.Arrays.fill(services, 1);
        services[0] = 0;
        services[10] = 0;
        long[] penalties = new long[11];
        java.util.Arrays.fill(penalties, 100_000);

        ModelResult first = solve(travel, services, windows, penalties, 300, false);
        ModelResult second = solve(travel, services, windows, penalties, 300, false);

        assertThat(first.solutionFound()).isTrue();
        assertThat(first.route()).hasSize(11).startsWith(0).endsWith(10);
        assertThat(second.route()).isEqualTo(first.route());
        assertThat(second.dropped()).isEmpty();
    }

    @Test
    void solverHonorsConfiguredTimeLimit() {
        Instant started = Instant.now();
        ModelResult result = solve(sequentialMatrix(11), new long[11],
                broadWindows(11, 500), filledPenalties(11), 50, true);
        long elapsedMillis = java.time.Duration.between(started, Instant.now()).toMillis();

        assertThat(result.solutionFound()).isTrue();
        assertThat(elapsedMillis).isLessThan(2_000);
    }

    private static ModelResult solve(long[][] travel, long[] services, long[][] windows,
                                     long[] penalties, long timeoutMillis, boolean localSearch) {
        int endNode = travel.length - 1;
        RoutingIndexManager manager = new RoutingIndexManager(
                travel.length, 1, new int[]{0}, new int[]{endNode});
        RoutingModel routing = new RoutingModel(manager);
        int transit = routing.registerTransitCallback((from, to) -> {
            int fromNode = manager.indexToNode(from);
            int toNode = manager.indexToNode(to);
            return travel[fromNode][toNode] + services[fromNode];
        });
        routing.setArcCostEvaluatorOfAllVehicles(transit);
        routing.addDimension(transit, 200, windows[endNode][1], false, "Time");
        RoutingDimension time = routing.getMutableDimension("Time");
        time.cumulVar(routing.start(0)).setRange(windows[0][0], windows[0][1]);
        time.cumulVar(routing.end(0)).setRange(windows[endNode][0], windows[endNode][1]);
        for (int node = 1; node < endNode; node++) {
            long index = manager.nodeToIndex(node);
            time.cumulVar(index).setRange(windows[node][0], windows[node][1]);
            routing.addDisjunction(new long[]{index}, penalties[node]);
        }

        RoutingSearchParameters.Builder parameters = defaultRoutingSearchParameters().toBuilder()
                .setFirstSolutionStrategy(FirstSolutionStrategy.Value.PATH_CHEAPEST_ARC)
                .setTimeLimit(Duration.newBuilder()
                        .setSeconds(timeoutMillis / 1_000)
                        .setNanos((int) ((timeoutMillis % 1_000) * 1_000_000))
                        .build());
        if (localSearch) {
            parameters.setLocalSearchMetaheuristic(
                    LocalSearchMetaheuristic.Value.GUIDED_LOCAL_SEARCH);
        }
        Assignment solution = routing.solveWithParameters(parameters.build());
        if (solution == null) return new ModelResult(false, List.of(), List.of(), -1);

        List<Integer> route = new ArrayList<>();
        long index = routing.start(0);
        while (!routing.isEnd(index)) {
            route.add(manager.indexToNode(index));
            index = solution.value(routing.nextVar(index));
        }
        route.add(manager.indexToNode(index));
        List<Integer> dropped = new ArrayList<>();
        for (int node = 1; node < endNode; node++) {
            long nodeIndex = manager.nodeToIndex(node);
            if (solution.value(routing.nextVar(nodeIndex)) == nodeIndex) dropped.add(node);
        }
        return new ModelResult(true, route, dropped,
                solution.value(time.cumulVar(routing.end(0))));
    }

    private static long[][] sequentialMatrix(int size) {
        long[][] matrix = new long[size][size];
        for (int from = 0; from < size; from++) {
            for (int to = 0; to < size; to++) matrix[from][to] = Math.abs(from - to) * 3L;
        }
        return matrix;
    }

    private static long[][] broadWindows(int size, long end) {
        long[][] windows = new long[size][2];
        for (long[] window : windows) window[1] = end;
        return windows;
    }

    private static long[] filledPenalties(int size) {
        long[] penalties = new long[size];
        java.util.Arrays.fill(penalties, 100_000);
        return penalties;
    }

    private record ModelResult(boolean solutionFound, List<Integer> route,
                               List<Integer> dropped, long endTime) {
    }
}
