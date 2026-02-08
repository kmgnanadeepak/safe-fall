import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Phone } from 'lucide-react'
import { falleventsApi, emergencyContactsApi, notificationsApi } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface EmergencyOverlayProps{
  isOpen:boolean
  onClose:()=>void
  eventId?:string
}

export function EmergencyOverlay({isOpen,onClose,eventId}:EmergencyOverlayProps){
  const {user}=useAuth()

  const [countdown,setCountdown]=useState(30)
  const [status,setStatus]=useState<'countdown'|'resolved'|'emergency'>('countdown')

  /* ---------------- RESET ONLY WHEN OPENED ---------------- */
  useEffect(()=>{
    if(isOpen){
      setCountdown(30)
      setStatus('countdown')
    }
  },[isOpen])

  /* ---------------- COUNTDOWN ---------------- */
  useEffect(()=>{
    if(!isOpen||status!=='countdown') return

    const timer=setInterval(()=>{
      setCountdown(prev=>{
        if(prev<=1){
          clearInterval(timer)
          handleEmergency()
          return 0
        }
        return prev-1
      })
    },1000)

    return()=>clearInterval(timer)
  },[isOpen,status])

  /* ---------------- EMERGENCY (REAL SMS) ---------------- */
  const handleEmergency=useCallback(async()=>{
  if(!user||!eventId) return

  setStatus('emergency')

  await falleventsApi.update(eventId,{is_emergency:true})

  const {data:contacts}=await emergencyContactsApi.list()
  const contact=(contacts&&contacts.length>0)?(contacts[0] as {phone:string}):null
  const phone=contact?.phone

  if(phone){
    await fetch("https://send-emergency-sms.kmgnadeepak.workers.dev",{
      method:"POST",
      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer my-secret-123"
      },
      body:JSON.stringify({
        phones:[phone],
        message:`🚨 SAFE FALL ALERT!
Accident detected for user ${user.email}.
Please respond immediately.`,
      })
    })
  }

  await notificationsApi.create({
    user_id:user.id,
    type:'emergency',
    title:'Emergency Alert Triggered',
    message:phone?`Real SMS sent to ${phone}`:'No emergency contact set.',
    related_event_id:eventId,
  })

  toast.error(phone?"🚨 Emergency SMS sent to emergency contact!":"🚨 Emergency marked. Add an emergency contact for SMS alerts.")

  setTimeout(onClose,3000)
},[user,eventId,onClose])

/* ---------------- I'M OK ---------------- */
const handleOk=async()=>{
  if(!user||!eventId) return

  setStatus('resolved')

  await falleventsApi.update(eventId,{
    is_emergency:false,
    resolved:true,
    resolved_at:new Date().toISOString(),
  })

  toast.success('Marked as false alarm')

  setTimeout(onClose,2000)
}


  /* ---------------- UI (UNCHANGED) ---------------- */
  return(
    <motion.div
      initial={false}
      animate={{
        opacity:isOpen?1:0,
        pointerEvents:isOpen?'auto':'none',
      }}
      className="emergency-overlay"
    >
      <motion.div
        animate={{
          scale:isOpen?1:0.95,
          opacity:isOpen?1:0,
        }}
        className="text-center"
      >
        {status==='countdown'&&(
          <>
            <AlertTriangle className="mx-auto mb-6 h-24 w-24 text-danger animate-pulse"/>
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Fall Detected!
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Emergency services will be contacted in:
            </p>
            <div className="emergency-countdown mb-10">
              {countdown}
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <button
                onClick={handleOk}
                className="flex items-center justify-center gap-2 rounded-xl bg-success px-8 py-4 text-lg font-semibold text-success-foreground hover:bg-success/90"
              >
                <CheckCircle className="h-6 w-6"/>
                I'm OK
              </button>

              <button
                onClick={handleEmergency}
                className="btn-danger flex items-center justify-center gap-2 px-8 py-4 text-lg"
              >
                <Phone className="h-6 w-6"/>
                Emergency - Need Help!
              </button>
            </div>
          </>
        )}

        {status==='resolved'&&(
          <>
            <CheckCircle className="mx-auto mb-6 h-24 w-24 text-success"/>
            <h2 className="mb-4 text-3xl font-bold text-success">
              All Clear!
            </h2>
            <p className="text-lg text-muted-foreground">
              Glad you're okay. Stay safe!
            </p>
          </>
        )}

        {status==='emergency'&&(
          <>
            <Phone className="mx-auto mb-6 h-24 w-24 text-danger animate-pulse"/>
            <h2 className="mb-4 text-3xl font-bold text-danger">
              Emergency Alert Sent!
            </h2>
            <p className="text-lg text-muted-foreground">
              SMS has been sent to your emergency contact.
            </p>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}
