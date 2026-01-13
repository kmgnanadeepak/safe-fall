import {useState,useEffect} from "react"
import {motion} from "framer-motion"
import {
  Map,
  AlertTriangle,
  Loader2,
  MapPin,
  Clock,
  Navigation,
  AlertCircle
} from "lucide-react"
import {GoogleMap,Marker,useJsApiLoader} from "@react-google-maps/api"
import {AppLayout} from "@/components/layout/AppLayout"
import {useAuth} from "@/contexts/AuthContext"
import {useGeolocation} from "@/hooks/useGeolocation"
import {supabase} from "@/integrations/supabase/client"

interface EmergencyLocation{
  id:string
  user_id:string
  latitude:number
  longitude:number
  timestamp:string
  is_emergency:boolean
  patient_name?:string
}

export default function LiveMap(){
  const {user,role}=useAuth()
  const {
    latitude:geoLat,
    longitude:geoLng,
    loading:geoLoading,
    error:geoError,
    permissionDenied,
    requestPermission
  }=useGeolocation()

  const [loading,setLoading]=useState(true)
  const [emergencyLocations,setEmergencyLocations]=useState<EmergencyLocation[]>([])
  const [hasActiveEmergency,setHasActiveEmergency]=useState(false)

  const {isLoaded}=useJsApiLoader({
    googleMapsApiKey:import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  })

  /* ---------------- FETCH LOCATIONS ---------------- */

  useEffect(()=>{
    if(!user?.id)return
    fetchLocations()

    const channel=supabase
      .channel("fall_events_location")
      .on(
        "postgres_changes",
        {event:"*",schema:"public",table:"fall_events"},
        ()=>fetchLocations()
      )
      .subscribe()

    return()=>{channel.unsubscribe()}
  },[user?.id,role])

  const fetchLocations=async()=>{
    if(!user?.id)return

    if(role==="hospital"){
      const {data}=await supabase
        .from("fall_events")
        .select("*")
        .eq("is_emergency",true)
        .eq("resolved",false)
        .not("latitude","is",null)

      if(data){
        const enriched:EmergencyLocation[]=[]
        for(const e of data){
          const {data:profile}=await supabase
            .from("profiles")
            .select("name")
            .eq("user_id",e.user_id)
            .maybeSingle()

          enriched.push({
            id:e.id,
            user_id:e.user_id,
            latitude:e.latitude,
            longitude:e.longitude,
            timestamp:e.timestamp,
            is_emergency:true,
            patient_name:profile?.name||"Unknown Patient"
          })
        }
        setEmergencyLocations(enriched)
        setHasActiveEmergency(enriched.length>0)
      }
    }else{
      const {data}=await supabase
        .from("fall_events")
        .select("*")
        .eq("user_id",user.id)
        .eq("is_emergency",true)
        .eq("resolved",false)
        .order("timestamp",{ascending:false})
        .limit(1)
        .maybeSingle()

      if(data){
        setEmergencyLocations([{
          id:data.id,
          user_id:data.user_id,
          latitude:data.latitude,
          longitude:data.longitude,
          timestamp:data.timestamp,
          is_emergency:true
        }])
        setHasActiveEmergency(true)
      }else{
        setEmergencyLocations([])
        setHasActiveEmergency(false)
      }
    }

    setLoading(false)
  }

  /* -------- UPDATE PATIENT LOCATION DURING EMERGENCY -------- */

  useEffect(()=>{
    if(
      role==="patient" &&
      hasActiveEmergency &&
      geoLat &&
      geoLng &&
      emergencyLocations[0]
    ){
      supabase
        .from("fall_events")
        .update({latitude:geoLat,longitude:geoLng})
        .eq("id",emergencyLocations[0].id)
    }
  },[geoLat,geoLng,hasActiveEmergency,role,emergencyLocations])

  if(loading||!isLoaded){
    return(
      <AppLayout>
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin"/>
        </div>
      </AppLayout>
    )
  }

  const mapCenter={
    lat:emergencyLocations[0]?.latitude||geoLat||28.6139,
    lng:emergencyLocations[0]?.longitude||geoLng||77.2090
  }

  return(
    <AppLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Live Map</h1>
          <p className="page-subtitle">
            {role==="hospital"
              ?"Track patient locations during active emergencies"
              :"Your location tracking during emergencies"}
          </p>
        </div>

        {/* Permission Warning */}
        {permissionDenied&&(
          <motion.div
            initial={{opacity:0,y:-10}}
            animate={{opacity:1,y:0}}
            className="flex items-center gap-3 rounded-lg border border-warning/30 bg-warning/10 p-4"
          >
            <AlertCircle className="text-warning"/>
            <div className="flex-1">
              <p className="font-medium text-warning">
                Location Permission Required
              </p>
              <p className="text-sm text-muted-foreground">
                {geoError}
              </p>
            </div>
            <button onClick={requestPermission} className="btn-gradient">
              Enable Location
            </button>
          </motion.div>
        )}

        {/* Emergency Status */}
        {hasActiveEmergency&&(
          <motion.div
            initial={{opacity:0,y:-10}}
            animate={{opacity:1,y:0}}
            className="flex items-center gap-3 rounded-lg border border-danger/30 bg-danger/10 p-4"
          >
            <AlertTriangle className="animate-pulse text-danger"/>
            <div>
              <p className="font-medium text-danger">
                {role==="hospital"
                  ?`${emergencyLocations.length} Active Emergencies`
                  :"Active Emergency"}
              </p>
              <p className="text-sm text-muted-foreground">
                Live location sharing enabled
              </p>
            </div>
          </motion.div>
        )}

        {/* Google Map */}
        <motion.div
          initial={{opacity:0,y:20}}
          animate={{opacity:1,y:0}}
        >
          <GoogleMap
            mapContainerStyle={{width:"100%",height:"450px"}}
            center={mapCenter}
            zoom={15}
            options={{disableDefaultUI:true,zoomControl:true}}
          >
            {geoLat&&geoLng&&!hasActiveEmergency&&(
              <Marker position={{lat:geoLat,lng:geoLng}}/>
            )}

            {emergencyLocations.map(loc=>(
              <Marker
                key={loc.id}
                position={{lat:loc.latitude,lng:loc.longitude}}
                icon="https://maps.google.com/mapfiles/ms/icons/red-dot.png"
              />
            ))}
          </GoogleMap>
        </motion.div>

        {/* Location Info Cards (UNCHANGED FEATURES) */}
        <div className="grid gap-4 md:grid-cols-2">

          {/* Current Location */}
          <motion.div
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10">
                <Navigation className="text-info"/>
              </div>
              <div>
                <h3 className="font-semibold">Current Location</h3>
                {geoLat&&geoLng?(
                  <>
                    <p className="text-sm">
                      Lat: {geoLat.toFixed(6)}, Lng: {geoLng.toFixed(6)}
                    </p>
                    <p className="text-xs text-success">● Live tracking active</p>
                  </>
                ):(
                  <p className="text-sm">
                    {geoLoading?"Fetching location...":"Location unavailable"}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Emergency Location */}
          <motion.div
            initial={{opacity:0,y:20}}
            animate={{opacity:1,y:0}}
            className="glass-card p-6"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                hasActiveEmergency?"bg-danger/10":"bg-muted"
              }`}>
                <MapPin className={hasActiveEmergency?"text-danger":"text-muted-foreground"}/>
              </div>
              <div>
                <h3 className="font-semibold">
                  {role==="hospital"?"Emergency Patients":"Emergency Location"}
                </h3>
                {hasActiveEmergency?(
                  <>
                    <p className="text-sm">
                      {role==="hospital"
                        ?`${emergencyLocations.length} patient(s) need assistance`
                        :`Lat: ${emergencyLocations[0].latitude.toFixed(6)}, Lng: ${emergencyLocations[0].longitude.toFixed(6)}`}
                    </p>
                    <p className="text-xs text-danger">● Emergency active</p>
                  </>
                ):(
                  <p className="text-sm">No active emergency</p>
                )}
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    </AppLayout>
  )
}
