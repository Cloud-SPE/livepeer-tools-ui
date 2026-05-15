import type { JSX } from "react";
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Grid,
  Tooltip,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { LIVEPEER_EXPLORER_GATEWAY_URL } from "../config";
import { avatarInitial, formatEth, gatewayLabel, kindLabel, shortAddress } from "../service";
import type { Gateway } from "../types";

const AddressTooltip = styled(Tooltip)(({ theme }) => ({
  cursor: "pointer",
  textDecoration: "underline",
  "&:hover": { backgroundColor: theme.palette.grey[200] },
}));

interface Props {
  gateway: Gateway;
}

export function GatewayCard({ gateway }: Props): JSX.Element {
  const navigate = useNavigate();
  return (
    <Grid
      size={{
        xs: 12,
        sm: 6,
        md: 4,
      }}
    >
      <Card
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          "&:hover": { boxShadow: 6 },
        }}
        onClick={() => navigate(`/gateway/${gateway.address}`)}
      >
        <CardHeader
          avatar={
            gateway.avatarUrl ? (
              <Avatar src={gateway.avatarUrl} alt={gatewayLabel(gateway)} />
            ) : (
              <Avatar>{avatarInitial(gateway)}</Avatar>
            )
          }
          title={
            <Typography variant="h6" component="div">
              {gatewayLabel(gateway)}
            </Typography>
          }
          subheader={
            <AddressTooltip title={gateway.address} placement="top" arrow>
              <Typography variant="body2" color="textSecondary">
                {shortAddress(gateway.address)}
              </Typography>
            </AddressTooltip>
          }
          action={
            <Chip
              label={kindLabel(gateway.kind)}
              size="small"
              sx={{ mr: 1, mt: 1 }}
              color={gateway.kind === "ai" ? "info" : "default"}
            />
          }
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ mb: 1 }}>
            <Typography variant="subtitle1" color="textPrimary">
              Deposit:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatEth(gateway.depositEth)} ETH
            </Typography>
          </Box>
          <Box>
            <Typography variant="subtitle1" color="textPrimary">
              Reserve:
            </Typography>
            <Typography variant="body2" color="textSecondary">
              {formatEth(gateway.reserveEth)} ETH
            </Typography>
          </Box>
          <Box sx={{ mt: 1 }}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              target="_blank"
              href={LIVEPEER_EXPLORER_GATEWAY_URL(gateway.address)}
              rel="noopener"
              onClick={(e) => e.stopPropagation()}
            >
              View on Livepeer
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Grid>
  );
}
