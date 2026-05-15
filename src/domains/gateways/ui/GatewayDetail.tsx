import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import { useNavigate, useParams } from "react-router-dom";
import { LIVEPEER_EXPLORER_GATEWAY_URL } from "../config";
import { useGateway, useGatewayPayouts } from "../runtime";
import {
  avatarInitial,
  formatEth,
  formatUsd,
  gatewayLabel,
  kindLabel,
  recipientLabel,
  shortAddress,
} from "../service";
import type { Gateway, GatewayPayoutRow } from "../types";

function GatewayHeader({ gateway }: { gateway: Gateway }): JSX.Element {
  return (
    <Box>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
        {gateway.avatarUrl ? (
          <Avatar src={gateway.avatarUrl} sx={{ width: 50, height: 50 }} />
        ) : (
          <Avatar sx={{ width: 50, height: 50 }}>{avatarInitial(gateway)}</Avatar>
        )}
        <Typography variant="h4">{gatewayLabel(gateway)}</Typography>
        <Chip
          label={kindLabel(gateway.kind)}
          color={gateway.kind === "ai" ? "info" : "default"}
        />
      </Stack>
      <Button
        variant="contained"
        color="primary"
        target="_blank"
        href={LIVEPEER_EXPLORER_GATEWAY_URL(gateway.address)}
        rel="noopener"
      >
        View on Livepeer
      </Button>
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle1">ETH Address:</Typography>
        <Typography variant="body2" color="textSecondary">
          {gateway.address}
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Deposit:</Typography>
        <Typography variant="body2" color="textSecondary">
          {formatEth(gateway.depositEth)} ETH
        </Typography>
      </Box>
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1">Reserve:</Typography>
        <Typography variant="body2" color="textSecondary">
          {formatEth(gateway.reserveEth)} ETH
        </Typography>
      </Box>
      {gateway.unlockInProgress && (
        <Alert severity="info" sx={{ mt: 2 }}>
          Unlock in progress
          {gateway.withdrawRound != null ? ` — round ${gateway.withdrawRound}` : ""}
        </Alert>
      )}
    </Box>
  );
}

function PayoutsTable({ address }: { address: string }): JSX.Element {
  const navigate = useNavigate();
  const payoutsQ = useGatewayPayouts(address);

  const columns: GridColDef<GatewayPayoutRow & { id: string }>[] = [
    {
      field: "recipient",
      headerName: "Orchestrator",
      flex: 1.2,
      minWidth: 180,
      sortable: false,
      valueGetter: (_v, row) => recipientLabel(row),
      renderCell: (params) => (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Avatar
            src={params.row.toIdentity?.avatarUrl ?? undefined}
            alt={recipientLabel(params.row)}
            sx={{ width: 24, height: 24 }}
          />
          <span>{recipientLabel(params.row)}</span>
        </Stack>
      ),
    },
    {
      field: "amountEth",
      headerName: "Amount (ETH)",
      type: "number",
      flex: 0.9,
      minWidth: 130,
      headerAlign: "right",
      align: "right",
      valueFormatter: (v: number) => formatEth(v, 4),
    },
    {
      field: "amountUsd",
      headerName: "Amount (USD)",
      type: "number",
      flex: 0.9,
      minWidth: 130,
      headerAlign: "right",
      align: "right",
      valueFormatter: (v: number) => formatUsd(v),
    },
    {
      field: "flowKind",
      headerName: "Flow",
      flex: 0.8,
      minWidth: 130,
      sortable: false,
    },
    {
      field: "blockTimestamp",
      headerName: "Date/Time (UTC)",
      flex: 1,
      minWidth: 175,
      valueGetter: (v: string | null) => v ?? "",
      valueFormatter: (v: string) =>
        v ? new Date(v).toISOString().replace("T", " ").slice(0, 19) : "",
    },
    {
      field: "txHash",
      headerName: "Tx",
      flex: 0.8,
      minWidth: 120,
      sortable: false,
      valueFormatter: (v: string) => shortAddress(v),
    },
  ];

  const rows = (payoutsQ.data?.data ?? []).map((r, i) => ({
    ...r,
    id: `${r.eventId}-${i}`,
  }));

  if (payoutsQ.error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load payouts: {payoutsQ.error.message}
      </Alert>
    );
  }

  return (
    <>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h6">Latest Payouts</Typography>
        {payoutsQ.data?.semantics && (
          <Chip label={payoutsQ.data.semantics} size="small" variant="outlined" />
        )}
      </Stack>
      <Paper>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={payoutsQ.isLoading}
          autoHeight
          initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
          pageSizeOptions={[25, 50, 100]}
          disableRowSelectionOnClick
          onRowClick={(p) =>
            p.row.toAddress && navigate(`/orchestrator/${p.row.toAddress}`)
          }
          sx={{
            cursor: "pointer",
            "& .MuiDataGrid-columnHeaders": { backgroundColor: "#f5f5f5" },
          }}
        />
      </Paper>
    </>
  );
}

export function GatewayDetail(): JSX.Element {
  const params = useParams<{ eth_address: string }>();
  const address = params.eth_address ?? "";
  const { data, isLoading, error } = useGateway(address);

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
        <Alert severity="error">Failed to load gateway: {error.message}</Alert>
      </Box>
    );
  }
  if (!data) {
    return (
      <Box sx={{ py: 4 }}>
        <Alert severity="warning">Gateway not found.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ py: 4 }}>
      <GatewayHeader gateway={data} />
      <PayoutsTable address={data.address} />
    </Box>
  );
}
