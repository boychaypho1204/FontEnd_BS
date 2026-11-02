// import { useState } from "react";
// import { BookOpen, User, Lock, Info } from "lucide-react";
// import { useAuth } from "../context/AuthContext";
// import { toast } from "react-toastify";

// export function Login() {
//   const { login } = useAuth();
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setError("");
//     setIsSubmitting(true);

//     try {
//       await login(username, password);
//       toast.success("Signed in successfully");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Login failed");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
//       <div
//         className="absolute inset-0 z-0 bg-cover bg-center opacity-10"
//         style={{
//           backgroundImage:
//             "url('https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=2000&auto=format&fit=crop')",
//         }}
//       />
//       <div className="absolute inset-0 z-0 bg-gradient-to-br from-background/90 to-surface-variant/90" />

//       <div className="relative z-10 w-full max-w-md mx-4 p-8 bg-surface border border-outline-variant rounded-xl shadow-lg">
//         <div className="flex flex-col items-center mb-8">
//           <BookOpen className="text-primary mb-4" size={48} />
//           <h1 className="text-2xl font-bold text-on-surface text-center">
//             Bibliophile Admin
//           </h1>
//           <p className="text-sm text-on-surface-variant mt-2 text-center">
//             Secure Administrative Access
//           </p>
//         </div>

//         <form onSubmit={handleSubmit} className="space-y-6">
//           <div>
//             <label className="block text-xs font-semibold text-on-surface mb-2 tracking-wide uppercase">
//               Email or Username
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <User className="text-outline" size={18} />
//               </div>
//               <input
//                 type="text"
//                 className="block w-full pl-10 pr-3 py-2 h-10 border border-outline-variant rounded bg-surface text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//                 placeholder="admin@bibliophile.com"
//                 value={username}
//                 onChange={(e) => setUsername(e.target.value)}
//                 required
//               />
//             </div>
//           </div>

//           <div>
//             <label className="block text-xs font-semibold text-on-surface mb-2 tracking-wide uppercase">
//               Password
//             </label>
//             <div className="relative">
//               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
//                 <Lock className="text-outline" size={18} />
//               </div>
//               <input
//                 type="password"
//                 className="block w-full pl-10 pr-3 py-2 h-10 border border-outline-variant rounded bg-surface text-sm text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
//                 placeholder="••••••••"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//               />
//             </div>
//           </div>

//           <div className="flex items-center justify-between">
//             <div className="flex items-center">
//               <input
//                 type="checkbox"
//                 id="remember"
//                 className="h-4 w-4 text-primary rounded border-outline-variant"
//               />
//               <label
//                 htmlFor="remember"
//                 className="ml-2 block text-sm text-on-surface-variant"
//               >
//                 Remember me
//               </label>
//             </div>
//             <a href="#" className="text-sm text-primary hover:underline">
//               Forgot password?
//             </a>
//           </div>

//           {error ? <p className="text-sm text-red-500">{error}</p> : null}

//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="w-full flex justify-center py-2 px-4 border border-transparent rounded h-10 shadow-sm text-sm font-semibold text-white bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors disabled:opacity-60"
//           >
//             {isSubmitting ? "Signing in..." : "Sign in to Dashboard"}
//           </button>

//           <div className="mt-4 text-center border-t border-outline-variant pt-4">
//             <p className="text-xs text-outline flex items-center justify-center gap-1">
//               <Info size={14} />
//               This portal is restricted to authorized personnel only.
//             </p>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }
