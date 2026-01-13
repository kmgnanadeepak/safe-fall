import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis } from 'recharts'

interface DataPoint{
  time:number
  x:number
  y:number
  z:number
}

interface SensorGraphProps{
  icon:LucideIcon
  label:string
  sensor:'accelerometer'|'gyroscope'
  delay?:number
}

const chartConfig={
  x:{label:'X',color:'hsl(0,84%,60%)'},
  y:{label:'Y',color:'hsl(142,76%,36%)'},
  z:{label:'Z',color:'hsl(199,89%,48%)'},
}

export function SensorGraph({icon:Icon,label,sensor,delay=0}:SensorGraphProps){
  const [data,setData]=useState<DataPoint[]>([])
  const maxDataPoints=30

  useEffect(()=>{
    const handleMotion=(e:DeviceMotionEvent)=>{
      if(sensor==='accelerometer' && e.accelerationIncludingGravity){
        const {x=0,y=0,z=0}=e.accelerationIncludingGravity
        pushData(x,y,z)
      }
      if(sensor==='gyroscope' && e.rotationRate){
        const {alpha=0,beta=0,gamma=0}=e.rotationRate
        pushData(alpha,beta,gamma)
      }
    }

    const pushData=(x:number,y:number,z:number)=>{
      setData(prev=>{
        const next=[...prev,{time:Date.now(),x,y,z}]
        return next.length>maxDataPoints?next.slice(-maxDataPoints):next
      })
    }

    // iOS permission
    if(
      typeof DeviceMotionEvent!=='undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission==='function'
    ){
      ;(DeviceMotionEvent as any).requestPermission().then((res:string)=>{
        if(res==='granted'){
          window.addEventListener('devicemotion',handleMotion)
        }
      })
    }else{
      window.addEventListener('devicemotion',handleMotion)
    }

    return()=>window.removeEventListener('devicemotion',handleMotion)
  },[sensor])

  const formatTime=(t:number)=>`${Math.floor((Date.now()-t)/1000)}s`

  return(
    <motion.div
      initial={{opacity:0,y:20}}
      animate={{opacity:1,y:0}}
      transition={{duration:.5,delay}}
      className="glass-card p-4"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary"/>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium">{label}</h3>
          <p className="text-xs text-muted-foreground">Live sensor data</p>
        </div>
      </div>

      <div className="h-40">
        <ChartContainer config={chartConfig}>
          <LineChart data={data}>
            <XAxis dataKey="time" tickFormatter={formatTime}/>
            <YAxis/>
            <ChartTooltip content={<ChartTooltipContent/>}/>
            <Line dataKey="x" stroke="hsl(0,84%,60%)" dot={false} isAnimationActive={false}/>
            <Line dataKey="y" stroke="hsl(142,76%,36%)" dot={false} isAnimationActive={false}/>
            <Line dataKey="z" stroke="hsl(199,89%,48%)" dot={false} isAnimationActive={false}/>
          </LineChart>
        </ChartContainer>
      </div>
    </motion.div>
  )
}
