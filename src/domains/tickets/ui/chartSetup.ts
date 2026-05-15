import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";

/**
 * Register the chart.js parts the tickets line chart needs. Side-effect
 * import. Kept narrow so other domains can register their own pieces
 * without conflicts.
 */
ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
);
