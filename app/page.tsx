"use client"

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts'
import { PlayCircle, PauseCircle, Info, Download } from 'lucide-react'
import { PIDController, autoTune, ControllerType, SystemCharacteristics } from '@/lib/pidController'
import { exportToCSV } from '@/lib/dataExport'

const parameterExplanations = {
  kp: "Proportional gain: Responds to the current error. Higher values make the system respond more aggressively to errors.",
  ki: "Integral gain: Responds to the accumulated error over time. It helps eliminate steady-state errors.",
  kd: "Derivative gain: Responds to the rate of change of the error. It helps reduce overshooting and oscillations.",
}

export default function AdvancedPIDVisualizer() {
  const [controllers, setControllers] = useState([
    new PIDController('PID 1', 1, 0, 0, ControllerType.PID),
    new PIDController('PID 2', 1, 0, 0, ControllerType.PID),
  ])
  const [activeController, setActiveController] = useState(0)
  const [setpoint, setSetpoint] = useState(0)
  const [customSetpoint, setCustomSetpoint] = useState("0")
  const [data, setData] = useState<any[]>([])
  const [time, setTime] = useState(0)
  const [isRunning, setIsRunning] = useState(true)
  const [disturbance, setDisturbance] = useState(0)
  const animationRef = useRef<number>()

  const updateController = useCallback((index: number, updates: Partial<PIDController>) => {
    setControllers(prevControllers => {
      const newControllers = [...prevControllers]
      newControllers[index] = { ...newControllers[index], ...updates }
      return newControllers
    })
  }, [])

  const changeSetpoint = useCallback(() => {
    setSetpoint(Math.random() * 2 - 1)
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
    setDisturbance(Math.random() * 0.5 - 0.25)
  }, [])

  const autoTuneController = useCallback(() => {
    const systemCharacteristics: SystemCharacteristics = {
      processGain: 1,
      timeConstant: 1,
      deadTime: 0.1,
    }
    const tuningParams = autoTune(systemCharacteristics)
    updateController(activeController, tuningParams)
  }, [activeController, updateController])

  const exportData = useCallback(() => {
    exportToCSV(data, 'pid_simulation_data.csv')
  }, [data])

  const updateSimulation = useCallback(() => {
    setTime((prevTime) => prevTime + 0.1)
    setData((prevData) => {
      const newData = controllers.reduce((acc, controller) => {
        const lastPoint = prevData[prevData.length - 1]?.[controller.name] || { processVariable: 0, integral: 0 }
        const error = setpoint - lastPoint.processVariable
        const output = controller.update(error, 0.1)
        const newProcessVariable = lastPoint.processVariable + output * 0.1 + disturbance

        acc[controller.name] = {
          processVariable: newProcessVariable,
          error,
          output,
        }
        return acc
      }, {} as Record<string, any>)

      newData.time = time.toFixed(1)
      newData.setpoint = setpoint
      newData.disturbance = disturbance

      return [...prevData, newData].slice(-100)
    })

    if (isRunning) {
      animationRef.current = requestAnimationFrame(updateSimulation)
    }
  }, [controllers, setpoint, time, isRunning, disturbance])

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
        <Card className="w-full max-w-6xl">
          <CardHeader>
            <CardTitle>Advanced PID Controller Visualizer</CardTitle>
            <CardDescription>Compare multiple PID controllers and analyze system responses</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="controllers" className="space-y-4">
              <TabsList>
                <TabsTrigger value="controllers">Controllers</TabsTrigger>
                <TabsTrigger value="response">System Response</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>
              <TabsContent value="controllers" className="space-y-4">
                <div className="flex space-x-2">
                  <Select onValueChange={(value) => setActiveController(parseInt(value))}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select Controller" />
                    </SelectTrigger>
                    <SelectContent>
                      {controllers.map((controller, index) => (
                        <SelectItem key={index} value={index.toString()}>{controller.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => setControllers([...controllers, new PIDController(`PID ${controllers.length + 1}`, 1, 0, 0, ControllerType.PID)])}>
                    Add Controller
                  </Button>
                </div>
                {Object.entries(controllers[activeController]).map(([key, value]) => {
                  if (key === 'kp' || key === 'ki' || key === 'kd') {
                    return (
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
                          onValueChange={(newValue) => updateController(activeController, { [key]: newValue[0] })}
                        />
                        <span className="text-sm text-gray-500">{value.toFixed(2)}</span>
                      </div>
                    )
                  }
                  return null
                })}
                <div className="flex space-x-2">
                  <Select 
                    value={controllers[activeController].type} 
                    onValueChange={(value) => updateController(activeController, { type: value as ControllerType })}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Controller Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(ControllerType).map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={autoTuneController}>Auto-tune</Button>
                </div>
              </TabsContent>
              <TabsContent value="response">
                <div className="space-y-4">
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
                    <Button onClick={applyDisturbance}>Apply Disturbance</Button>
                    <Button onClick={exportData}>
                      <Download className="mr-2 h-4 w-4" />
                      Export Data
                    </Button>
                  </div>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" label={{ value: 'Time', position: 'insideBottomRight', offset: -5 }} />
                      <YAxis label={{ value: 'Value', angle: -90, position: 'insideLeft' }} />
                      <RechartsTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="setpoint" stroke="#8884d8" name="Setpoint" />
                      {controllers.map((controller, index) => (
                        <Line 
                          key={index} 
                          type="monotone" 
                          dataKey={`${controller.name}.processVariable`} 
                          stroke={`hsl(${index * 137.5 % 360}, 50%, 50%)`}
                          name={`${controller.name} Output`}
                        />
                      ))}
                      <Line type="monotone" dataKey="disturbance" stroke="#ff7300" name="Disturbance" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </TabsContent>
              <TabsContent value="analysis">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">System Response Analysis</h3>
                  {controllers.map((controller, index) => {
                    const lastDataPoint = data[data.length - 1]
                    const processVariable = lastDataPoint?.[controller.name]?.processVariable
                    const error = lastDataPoint?.[controller.name]?.error
                    const steadyStateError = Math.abs(error) < 0.01 ? error : 'N/A'
                    const overshoot = data.reduce((max, point) => Math.max(max, point[controller.name]?.processVariable || 0), 0) - setpoint
                    const settlingTime = data.findIndex((point, i, arr) => 
                      i > 0 && Math.abs(point[controller.name]?.processVariable - setpoint) < 0.05 * setpoint &&
                      arr.slice(i).every(p => Math.abs(p[controller.name]?.processVariable - setpoint) < 0.05 * setpoint)
                    ) * 0.1

                    return (
                      <div key={index} className="bg-gray-100 p-4 rounded-lg">
                        <h4 className="font-semibold">{controller.name}</h4>
                        <p>Current Output: {processVariable?.toFixed(2) || 'N/A'}</p>
                        <p>Steady-state Error: {typeof steadyStateError === 'number' ? steadyStateError.toFixed(4) : steadyStateError}</p>
                        <p>Overshoot: {overshoot.toFixed(2)}</p>
                        <p>Settling Time: {settlingTime.toFixed(2)}s</p>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}

