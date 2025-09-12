"use client";

import { useEffect, useRef } from "react";
import { Network } from "vis-network";
import { DataSet } from "vis-data";
import { createClient } from "@/lib/supabase/client"; // 👈 client-side supabase

interface NetworkVisualizationProps {
  currentUser: {
    id: string;
    full_name: string | null;
    email: string;
  } | null;
  upline: {
    upline_id: string;
    upline: {
      id: string;
      full_name: string | null;
      email: string;
    };
  } | null;
  downlines: Array<{
    agent_id: string;
    agent: {
      id: string;
      full_name: string | null;
      email: string;
    };
  }>;
}

export function NetworkVisualization({
  currentUser,
  upline,
  downlines,
}: NetworkVisualizationProps) {
  const networkRef = useRef<HTMLDivElement>(null);
  const networkInstance = useRef<Network | null>(null);
  const nodes = useRef(new DataSet<any>([]));
  const edges = useRef(new DataSet<any>([]));

  // helper: add downlines for a parent node
  function addDownlines(parentId: string, children: any[]) {
    children.forEach((child) => {
      if (!nodes.current.get(child.agent.id)) {
        nodes.current.add({
          id: child.agent.id,
          label: child.agent.full_name || child.agent.email,
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
        });
      }

      if (!edges.current.get({ from: parentId, to: child.agent.id })) {
        edges.current.add({
          from: parentId,
          to: child.agent.id,
          arrows: "to",
          color: { color: "#f59e0b", highlight: "#d97706" },
          width: 2,
          smooth: { type: "continuous" },
        });
      }
    });
  }

  useEffect(() => {
    if (!networkRef.current || !currentUser) return;

    // Reset datasets
    nodes.current.clear();
    edges.current.clear();

    // Add current user
    nodes.current.add({
      id: currentUser.id,
      label: currentUser.full_name || currentUser.email,
      color: {
        background: "#3b82f6",
        border: "#1d4ed8",
        highlight: { background: "#2563eb", border: "#1e40af" },
      },
      font: { color: "white", size: 14, face: "arial" },
      shape: "circle",
      size: 30,
      borderWidth: 3,
    });

    // Add upline
    if (upline?.upline) {
      nodes.current.add({
        id: upline.upline.id,
        label: upline.upline.full_name || upline.upline.email,
        color: {
          background: "#10b981",
          border: "#059669",
          highlight: { background: "#059669", border: "#047857" },
        },
        font: { color: "white", size: 12, face: "arial" },
        shape: "circle",
        size: 25,
        borderWidth: 2,
      });

      edges.current.add({
        from: upline.upline.id,
        to: currentUser.id,
        arrows: "to",
        color: { color: "#10b981", highlight: "#059669" },
        width: 2,
        smooth: { type: "continuous" },
      });
    }

    // Add initial downlines
    addDownlines(currentUser.id, downlines);

    // Create network
    const data = { nodes: nodes.current, edges: edges.current };
    const options = {
      layout: {
        hierarchical: {
          enabled: true,
          direction: "UD",
          sortMethod: "directed",
          nodeSpacing: 150,
          levelSeparation: 200,
          treeSpacing: 200,
        },
      },
      physics: { enabled: false },
      interaction: {
        dragNodes: true,
        dragView: true,
        zoomView: true,
        selectConnectedEdges: false,
      },
    };

    networkInstance.current = new Network(networkRef.current, data, options);

    // Handle clicks → fetch children dynamically
    networkInstance.current.on("click", async (params) => {
      console.log("on click node");
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const supabase = createClient();

        // Fetch children for clicked node
        const { data: childDownlines, error } = await supabase
          .from("agent_hierarchy")
          .select("agent_id, agent:agent_id(id, full_name, email)")
          .eq("upline_id", nodeId)
          .eq("approved", true);

        console.log({ childDownlines, error });

        if (error) {
          console.error("Error fetching downlines:", error.message);
          return;
        }

        if (childDownlines && childDownlines.length > 0) {
          addDownlines(nodeId, childDownlines);
          networkInstance.current?.setData({
            nodes: nodes.current,
            edges: edges.current,
          });
        }
      }
    });

    return () => {
      networkInstance.current?.destroy();
      networkInstance.current = null;
    };
  }, [currentUser, upline, downlines]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-96 text-muted-foreground">
        <p>Unable to load network data</p>
      </div>
    );
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
        <p>Click a node to load deeper levels</p>
      </div>
      <div
        ref={networkRef}
        className="w-full h-96 border rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800"
      />
    </div>
  );
}
