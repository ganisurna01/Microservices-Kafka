"use client";

import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReceiptIcon from "@mui/icons-material/Receipt"; // Orders icon
import { useCurrentUser } from "@/context/CurrentUserContext";

export default function Header() {
  const router = useRouter();

  const { currentUser: user, loading, setCurrentUser } = useCurrentUser();

  async function handleLogout() {
    try {
      const response = await fetch("/api/users/signout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (response.ok) {
        setCurrentUser(null);
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <AppBar position="static" sx={{ backgroundColor: "bgPrimary" }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: "bold" }}>
          My E-commerce App
        </Typography>
        <Box className="flex justify-between items-center gap-10">
          <Box className="flex gap-3 items-center">
            {!loading && user && <></>}
          </Box>
          <Box className="flex gap-3 items-center">
            {!loading && !user && (
              <>
                <Button
                  color="inherit"
                  variant="outlined"
                  size="small"
                  component={Link}
                  href="/auth/login"
                  startIcon={<ReceiptIcon />}
                >
                  Login
                </Button>
                <Button
                  color="inherit"
                  variant="outlined"
                  size="small"
                  component={Link}
                  href="/auth/register"
                  startIcon={<ReceiptIcon />}
                >
                  Register
                </Button>
              </>
            )}
            {!loading && user && (
              <>
                <Button
                  color="inherit"
                  variant="outlined"
                  size="small"
                  component={Link}
                  href={`/orders`}
                  startIcon={<ReceiptIcon />}
                >
                  Your Orders
                </Button>
                <Button
                  color="inherit"
                  variant="outlined"
                  size="small"
                  onClick={handleLogout}
                  startIcon={<ReceiptIcon />}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
