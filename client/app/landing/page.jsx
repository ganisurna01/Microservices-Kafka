'use server'
// import { cookies } from 'next/headers';
import LandingPage from '@/components/LandingPage'
export default async function Home() {
// // Get cookies from the request
// const cookieStore = await cookies();
// const cookieHeader = cookieStore
//   .getAll() // Get all cookies
//   .map(cookie => `${cookie.name}=${cookie.value}`) // Convert to "name=value" format
//   .join('; '); // Join into a single string

// console.log({ cookies: cookieHeader });

//   try {
//       const response = await fetch("http://ingress-nginx-controller.ingress-nginx.svc.cluster.local/api/users/currentuser", {
//         method: 'GET',
//         headers:{
//           'Content-Type': 'application/json',
//           'Cookie': cookieHeader, // Pass cookies to the backend
//         },
//         credentials: 'include',
//         cache: 'no-cache'
//       });
//           if(!response.ok){
//             <div>Failed to fetch.</div>
//           }
//           const resData = await response.json();
//           console.log({resData});
//           if (!resData?.currentUser) {
//             return <div>You are NOT logged in.</div>;
//           }else{
//             return <div>Welcome, {resData.currentUser.email}!</div>;

//           }
//     } catch (error) {
//         console.error(error);
//     }
  return (
    <>
    <h1>This is the Landing page.</h1>
    <LandingPage/>
    </>
  );
}
