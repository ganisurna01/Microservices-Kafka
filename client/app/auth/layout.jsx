"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthLayout = ({ children }) => {
    // const router = useRouter();

    // useEffect(() => {
    //     if (!loading && user) {
    //         router.push("/");
    //     }
    // }, [loading, user, router]);

    // if (loading) return <div>Loading...</div>; // Prevent flickering

    return <>{children}</>;
};

export default AuthLayout;
