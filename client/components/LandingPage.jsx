'use client'
import React, {useState, useEffect} from "react";
import TicketsList from '@/components/TicketsList'
export default function LandingPage() {
  const [currentUser, setCurrentUser] = useState(null);

    useEffect(()=>{
      async function fetchUser(){
        try {
          const response = await fetch("/api/users/currentuser", {
            method: 'GET',
            headers:{
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            cache: 'no-cache',
          });
          const data = await response.json();
          setCurrentUser(data?.currentUser);
        } catch (error) {
          console.error(error)
        }
      }
      fetchUser();
    },[])
    
    return (
      <div>
        {currentUser? <div>Welcome, {currentUser.email}!</div> : <div>You are NOT logged in.</div>}
        <TicketsList/>
      </div>
    );
}
