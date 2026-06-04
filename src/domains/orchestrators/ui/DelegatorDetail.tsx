import type { JSX } from "react";
import ArrowBack from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { useDelegator } from "../runtime";
import { formatDateTime, formatEth, formatLpt, shortAddress } from "../service";
import type { DelegatorDelegation } from "../types";

function Stat({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6">{value}</Typography>
    </Grid>
  );
}

export function DelegatorDetail(): JSX.Element {
  const params = useParams<{ eth_address: string }>();
  const navigate = useNavigate();
  const address = params.eth_address ?? "";
  const { data, isLoading, error } = useDelegator(address);

  const columns: GridColDef<DelegatorDelegation & { id: string }>[] = [
    {
      field: "delegateAddress",
      headerName: "Orchestrator",
      flex: 1.2,
      renderCell: (params) => (
        <Tooltip title={params.row.delegateAddress}>
          <Link
            component={RouterLink}
            to={`/orchestrator/${params.row.delegateAddress}`}
            underline="hover"
          >
            {shortAddress(params.row.delegateAddress)}
          </Link>
        </Tooltip>
      ),
    },
    {
      field: "bondedPrincipalLpt",
      headerName: "Bonded Stake",
      type: "number",
      flex: 1,
      valueFormatter: (v: number) => formatLpt(v),
    },
    {
      field: "pendingFeesEth",
      headerName: "Pending Fees",
      type: "number",
      flex: 1,
      valueFormatter: (v: number | null) => (v == null ? "" : `${formatEth(v)} ETH`),
    },
    {
      field: "asOfTimestamp",
      headerName: "As Of",
      flex: 1,
      valueFormatter: (v: string) => formatDateTime(v),
    },
  ];

  if (isLoading) {
    return (
      <Box sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="error">Failed to load delegator: {error.message}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="warning">Delegator not found.</Alert>
      </Box>
    );
  }

  const rows = data.delegations.map((delegation) => ({
    ...delegation,
    id: delegation.delegateAddress,
  }));
  const totalBonded = data.delegations.reduce((sum, delegation) => {
    return sum + delegation.bondedPrincipalLpt;
  }, 0);

  return (
    <Box sx={{ py: 3, px: { xs: 2, md: 4 } }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
        <IconButton aria-label="Back" onClick={() => navigate(-1)}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h5" sx={{ wordBreak: "break-word" }}>
            Delegator
          </Typography>
          <Tooltip title={data.address}>
            <Typography variant="body2" color="text.secondary">
              {shortAddress(data.address)}
            </Typography>
          </Tooltip>
        </Box>
      </Stack>

      <Card>
        <CardContent>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Stat label="Active" value={data.isActive ? "Yes" : "No"} />
            <Stat label="Total Bonded" value={formatLpt(totalBonded)} />
            <Stat label="Delegations" value={data.delegations.length.toLocaleString()} />
            <Stat label="Last Seen Block" value={data.lastSeenBlock.toLocaleString()} />
          </Grid>
          {rows.length === 0 ? (
            <Alert severity="info">No current delegations found for this delegator.</Alert>
          ) : (
            <DataGrid
              rows={rows}
              columns={columns}
              autoHeight
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
