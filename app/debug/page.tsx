"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function DebugPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkUserRole = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug/check-user-role");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: "Failed to check user role" });
    } finally {
      setLoading(false);
    }
  };

  const testCreateUser = async () => {
    setLoading(true);
    try {
      // Use a unique email with timestamp to avoid conflicts
      const uniqueEmail = `test-${Date.now()}@example.com`;
      
      const response = await fetch("/api/admin/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: uniqueEmail,
          fullName: "Test User",
          role: "buyer",
          temporaryPassword: "TempPass123!",
        }),
      });
      const data = await response.json();
      setResult({ 
        ...data, 
        status: response.status,
        requestData: {
          email: uniqueEmail,
          fullName: "Test User",
          role: "buyer"
        }
      });
    } catch (error) {
      setResult({ error: "Failed to create user", details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug User Creation</h1>
      
      <div className="space-y-4">
        <Button onClick={checkUserRole} disabled={loading}>
          Check Current User Role
        </Button>
        
        <Button onClick={testCreateUser} disabled={loading}>
          Test Create User
        </Button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-bold mb-2">Result:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}