"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { PlayCircle, PauseCircle, Info } from 'lucide-react'

const parameterExplanations = {
  kp: "Proportional gain: Responds to the current error. Higher values make the system respond more aggressively to errors.",
  ki: "Integral gain: Responds to the accumulated error over time. It helps eliminate steady-state errors.",
  kd: "Derivative gain: Responds to the rate of change of the error. It helps reduce overshooting and oscillations.",
}

export default function PIDVisualizer() {
  const [kp, setKp] = useState(1)
  const [ki, setKi] = useState(0)
  const [kd, setKd] = useState(0)
  const [setpoint, setSetpoint] = useState(0)
  const [customSetpoint, setCustomSetpoint] = useState("0")
  const [data, setData] = useState<{ time: string; setpoint: number; processVariable: number; error: number; integral: number; output: number; disturbance: number; }[]>([])
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [disturbance, setDisturbance] = useState(0)
  const animationRef = useRef<number>()

  const pidController = useCallback((error: number, integral: number, lastError: number, dt: number) => {
    const p = kp * error
    const i = ki * (integral + error * dt)
    const d = kd * (error - lastError) / dt
    return p + i + d
  }, [kp, ki, kd])

  const changeSetpoint = useCallback(() => {
    setSetpoint(Math.random() * 2 - 1) // Random value between -1 and 1
  }, [])

  const applyCustomSetpoint = useCallback(() => {
    const newSetpoint = parseFloat(customSetpoint)
    if (!isNaN(newSetpoint)) {
      setSetpoint(newSetpoint)
    }
  }, [customSetpoint])

  const toggleSimulation = useCallback(() => {
    setIsRunning(prev => !prev)
  }, [])

  const applyDisturbance = useCallback(() => {
    setDisturbance(Math.random() * 0.5 - 0.25) // Random value between -0.25 and 0.25
  }, [])

  const findOptimalSettings = useCallback(() => {
    // This is a simplified method to find "optimal" settings
    // In a real-world scenario, this would be much more complex
    setKp(1.5)
    setKi(0.5)
    setKd(0.75)
  }, [])

  const updateSimulation = useCallback(() => {
    setTime((prevTime) => prevTime + 0.1)
    setData((prevData) => {
      const lastPoint = prevData[prevData.length - 1] || { processVariable: 0, integral: 0 }
      const error = setpoint - lastPoint.processVariable
      const integral = lastPoint.integral + error * 0.1
      const output = pidController(error, integral, lastPoint.error || 0, 0.1)
      const newProcessVariable = lastPoint.processVariable + output * 0.1 + disturbance

      const newPoint = {
        time: time.toFixed(1),
        setpoint,
        processVariable: newProcessVariable,
        error,
        integral,
        output,
        disturbance
      }

      const newData = [...prevData, newPoint]
      return newData.slice(-100) // Keep only the last 100 data points
    })

    if (isRunning) {
      animationRef.current = requestAnimationFrame(updateSimulation)
    }
  }, [setpoint, pidController, time, isRunning, disturbance])

  useEffect(() => {
    if (isRunning) {
      animationRef.current = requestAnimationFrame(updateSimulation)
    } else {
      cancelAnimationFrame(animationRef.current!)
    }

    return () => {
      cancelAnimationFrame(animationRef.current!)
    }
  }, [isRunning, updateSimulation])

  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-gray-100 to-gray-300 p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader>
            <CardTitle>PID Controller Visualizer</CardTitle>
            <CardDescription>Adjust the parameters to see how the PID controller responds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              {Object.entries({ kp, ki, kd }).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center">
                    <label className="text-sm font-medium mr-2">{key.toUpperCase()}</label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-4 w-4" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{parameterExplanations[key as keyof typeof parameterExplanations]}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Slider
                    min={0}
                    max={10}
                    step={0.1}
                    value={[value]}
                    onValueChange={(newValue) => {
                      switch (key) {
                        case 'kp': setKp(newValue[0]); break;
                        case 'ki': setKi(newValue[0]); break;
                        case 'kd': setKd(newValue[0]); break;
                      }
                    }}
                  />
                  <span className="text-sm text-gray-500">{value.toFixed(1)}</span>
                </div>
              ))}
              <div className="flex space-x-2">
                <Button onClick={changeSetpoint}>Random Setpoint</Button>
                <Input
                  type="number"
                  placeholder="Custom setpoint"
                  value={customSetpoint}
                  onChange={(e) => setCustomSetpoint(e.target.value)}
                  className="w-32"
                />
                <Button onClick={applyCustomSetpoint}>Apply</Button>
                <Button onClick={toggleSimulation} variant="outline">
                  {isRunning ? <PauseCircle className="mr-2 h-4 w-4" /> : <PlayCircle className="mr-2 h-4 w-4" />}
                  {isRunning ? 'Pause' : 'Play'}
                </Button>
              </div>
              <div className="flex space-x-2">
                <Button onClick={applyDisturbance}>Apply Disturbance</Button>
                <Button onClick={findOptimalSettings}>Find Optimal Settings</Button>
              </div>
            </div>
            <Tabs defaultValue="response">
              <TabsList>
                <TabsTrigger value="response">System Response</TabsTrigger>
                <TabsTrigger value="error">Error</TabsTrigger>
              </TabsList>
              <TabsContent value="response">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="setpoint" stroke="#8884d8" name="Setpoint" />
                    <Line type="monotone" dataKey="processVariable" stroke="#82ca9d" name="Process Variable" />
                    <Line type="monotone" dataKey="disturbance" stroke="#ff7300" name="Disturbance" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
              <TabsContent value="error">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
                    <YAxis label={{ value: 'Error', angle: -90, position: 'insideLeft' }} />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="error" stroke="#ff7300" name="Error" />
                  </LineChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}


