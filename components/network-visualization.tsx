"use client"

import { useEffect, useRef } from "react"
import { Network } from "vis-network"
import { DataSet } from "vis-data"

interface NetworkVisualizationProps {
  currentUser: {
    id: string
    full_name: string | null
    email: string
  } | null
  upline: {
    upline_id: string
    upline: {
      id: string
      full_name: string | null
      email: string
    }
  } | null
  downlines: Array<{
    agent_id: string
    agent: {
      id: string
      full_name: string | null
      email: string
    }
  }>
}

export function NetworkVisualization({ currentUser, upline, downlines }: NetworkVisualizationProps) {
  const networkRef = useRef<HTMLDivElement>(null)
  const networkInstance = useRef<Network | null>(null)

  useEffect(() => {
    if (!networkRef.current || !currentUser) return

    // Create nodes
    const nodes = new DataSet([])
    const edges = new DataSet([])

    // Add current user node (center)
    nodes.add({
      id: currentUser.id,
      label: currentUser.full_name || currentUser.email,
      color: {
        background: "#3b82f6",
        border: "#1d4ed8",
        highlight: {
          background: "#2563eb",
          border: "#1e40af",
        },
      },
      font: { color: "white", size: 14, face: "arial" },
      shape: "circle",
      size: 30,
      borderWidth: 3,
    })

    // Add upline node if exists
    if (upline?.upline) {
      nodes.add({
        id: upline.upline.id,
        label: upline.upline.full_name || upline.upline.email,
        color: {
          background: "#10b981",
          border: "#059669",
          highlight: {
            background: "#059669",
            border: "#047857",
          },
        },
        font: { color: "white", size: 12, face: "arial" },
        shape: "circle",
        size: 25,
        borderWidth: 2,
      })

      // Add edge from upline to current user
      edges.add({
        from: upline.upline.id,
        to: currentUser.id,
        arrows: "to",
        color: { color: "#10b981", highlight: "#059669" },
        width: 2,
        smooth: { type: "continuous" },
      })
    }

    // Add downline nodes
    downlines.forEach((downline) => {
      nodes.add({
        id: downline.agent.id,
        label: downline.agent.full_name || downline.agent.email,
        color: {
          background: "#f59e0b",
          border: "#d97706",
          highlight: {
            background: "#d97706",
            border: "#b45309",
          },
        },
        font: { color: "white", size: 12, face: "arial" },
        shape: "circle",
        size: 20,
        borderWidth: 2,
      })

      // Add edge from current user to downline
      edges.add({
        from: currentUser.id,
        to: downline.agent.id,
        arrows: "to",
        color: { color: "#f59e0b", highlight: "#d97706" },
        width: 2,
        smooth: { type: "continuous" },
      })
    })

    // Network options
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD", // Up-Down
          sortMethod: "directed",
          nodeSpacing: 150,
          levelSeparation: 200,
          treeSpacing: 200,
        },
      },
      physics: {
        enabled: false,
      },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        selectConnectedEdges: false,
      },
      nodes: {
        borderWidth: 2,
        shadow: {
          enabled: true,
          color: "rgba(0,0,0,0.2)",
          size: 10,
          x: 2,
          y: 2,
        },
      },
      edges: {
        shadow: {
          enabled: true,
          color: "rgba(0,0,0,0.1)",
          size: 5,
          x: 1,
          y: 1,
        },
      },
    }

    // Create network
    const data = { nodes, edges }
    networkInstance.current = new Network(networkRef.current, data, options)

    // Add click event listener
    networkInstance.current.on("click", (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0]
        console.log("Clicked node:", nodeId)
        // You can add more interaction logic here
      }
    })

    // Cleanup function
    return () => {
      if (networkInstance.current) {
        networkInstance.current.destroy()
        networkInstance.current = null
      }
    }
  }, [currentUser, upline, downlines])

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <p>Unable to load network data</p>
      </div>
    )
  }

  if (!upline && (!downlines || downlines.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-xl mb-4">
          {currentUser.full_name?.[0] || currentUser.email[0]}
        </div>
        <h3 className="text-lg font-semibold mb-2">You're at the root!</h3>
        <p className="text-center">
          You don't have any uplines or downlines yet.
          <br />
          Start building your network by getting referrals.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Upline</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>You</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <span>Downlines</span>
          </div>
        </div>
        <p>Click and drag to explore your network</p>
      </div>
      <div
        ref={networkRef}
        className="w-full h-96 border rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
        style={{ minHeight: "400px" }}
      />
    </div>
  )
}
