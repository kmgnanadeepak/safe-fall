import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'

interface DataPoint{
  index:number
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

const MAX_POINTS=30

export function SensorGraph({icon:Icon,label,sensor,delay=0}:SensorGraphProps){
  const [data,setData]=useState<DataPoint[]>(
    Array.from({length:MAX_POINTS},(_,i)=>({
      index:i,
      x:2,
      y:0,
      z:-2,
    }))
  )

  useEffect(()=>{
    let sensorFired=false

    const pushData=(x:number,y:number,z:number)=>{
      setData(prev=>[
        ...prev.slice(1),
        {
          index:prev[prev.length-1].index+1,
          x,y,z,
        },
      ])
    }

    const handleMotion=(e:DeviceMotionEvent)=>{
      sensorFired=true

      if(sensor==='accelerometer' && e.accelerationIncludingGravity){
        const {x=0,y=0,z=0}=e.accelerationIncludingGravity
        pushData(x,y,z)
      }

      if(sensor==='gyroscope' && e.rotationRate){
        const {alpha=0,beta=0,gamma=0}=e.rotationRate
        pushData(alpha,beta,gamma)
      }
    }

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

    // 💻 Desktop fallback (no sensors)
    const fallback=setInterval(()=>{
      if(!sensorFired){
        pushData(2,0,-2)
      }
    },500)

    return()=>{
      window.removeEventListener('devicemotion',handleMotion)
      clearInterval(fallback)
    }
  },[sensor])

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
          <p className="text-xs text-muted-foreground">
            {sensor==='accelerometer'?'Accelerometer':'Gyroscope'} data
          </p>
        </div>
      </div>

      <div className="h-58">
        <ChartContainer config={chartConfig}>
          <LineChart
            data={data}
            margin={{top:10,right:10,left:10,bottom:35}}
          >
            <CartesianGrid
              vertical={false}
              stroke="rgba(255,255,255,0.06)"
            />

            <XAxis
              dataKey="index"
              tick={false}
              tickLine={false}
              axisLine={{
                stroke:'rgba(255,255,255,0.4)',
                strokeWidth:2,
              }}
              label={{
                value:'Time',
                position:'insideBottom',
                offset:-10,
                fill:'rgba(255,255,255,0.5)',
                fontSize:12,
              }}
            />

            <YAxis domain={[-10,10]}/>

            <ChartTooltip content={<ChartTooltipContent/>}/>

            <Line dataKey="x" stroke="hsl(0,84%,60%)" strokeWidth={2} dot={false} isAnimationActive={false}/>
            <Line dataKey="y" stroke="hsl(142,76%,36%)" strokeWidth={2} dot={false} isAnimationActive={false}/>
            <Line dataKey="z" stroke="hsl(199,89%,48%)" strokeWidth={2} dot={false} isAnimationActive={false}/>
          </LineChart>
        </ChartContainer>
      </div>
    </motion.div>
  )
}
