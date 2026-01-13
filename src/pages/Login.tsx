import React,{useState}from'react'
import{Link,useNavigate}from'react-router-dom'
import{motion}from'framer-motion'
import{Shield,Mail,Lock,Loader2,Eye,EyeOff}from'lucide-react'
import{useAuth}from'@/contexts/AuthContext'
import{toast}from'sonner'

export default function Login(){
  const[email,setEmail]=useState('')
  const[password,setPassword]=useState('')
  const[showPassword,setShowPassword]=useState(false)
  const[loading,setLoading]=useState(false)
  const{signIn,role}=useAuth()
  const navigate=useNavigate()

  const handleSubmit=async(e:React.FormEvent)=>{
    e.preventDefault()
    setLoading(true)
    const{error}=await signIn(email,password)
    if(error){
      toast.error(error.message)
      setLoading(false)
      return
    }
    toast.success('Welcome back!')
    setTimeout(()=>navigate('/dashboard'),100)
  }

  React.useEffect(()=>{
    if(role==='hospital')navigate('/hospital-dashboard')
    else if(role==='patient')navigate('/dashboard')
  },[role,navigate])

  return(
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"/>
        <div className="absolute -bottom-1/4 -right-1/4 h-96 w-96 rounded-full bg-primary/5 blur-3xl"/>
      </div>

      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.5}} className="glass-card relative z-10 w-full max-w-md p-8">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Shield className="h-8 w-8 text-primary"/>
          </div>
          <h1 className="text-2xl font-bold text-foreground">SafeFall AI</h1>
          <p className="mt-2 text-center text-muted-foreground">Fall Detection & Emergency Response</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="glass-input w-full pl-12" placeholder="Enter your email" required/>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground"/>
              <input type={showPassword?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="glass-input w-full px-12" placeholder="Enter your password" required/>
              <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-gradient w-full disabled:opacity-50">
            {loading?<Loader2 className="mx-auto h-5 w-5 animate-spin"/>:'Sign In'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don't have an account? <Link to="/register" className="font-medium text-primary hover:underline">Sign up</Link>
        </p>
      </motion.div>
    </div>
  )
}
