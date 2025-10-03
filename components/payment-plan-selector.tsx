"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CreditCard,
  Calendar,
  CheckCircle,
  Calculator,
  Clock,
} from "lucide-react";
import { PaymentPlan, PaymentPlanOption } from "@/lib/types";

interface PaymentPlanSelectorProps {
  totalAmount: number;
  allowedPlans?: PaymentPlan[];
  selectedPlan?: PaymentPlan | null;
  selectedTimeframe?: number;
  onPlanChange: (plan: PaymentPlan) => void;
  onTimeframeChange: (months: number) => void;
  className?: string;
}

// Default payment plan options
const DEFAULT_PAYMENT_PLAN_OPTIONS: PaymentPlanOption[] = [
  {
    id: "full",
    name: "Full Payment",
    description: "Pay the complete amount upfront and save on processing fees",
    installments: 1,
    percentages: [100],
  },
  {
    id: "30-30-40",
    name: "3-Installment Plan",
    description: "Split your payment into three manageable installments",
    installments: 3,
    percentages: [30, 30, 40],
  },
  {
    id: "25x4",
    name: "4-Installment Plan",
    description:
      "Equal payments over four installments for maximum flexibility",
    installments: 4,
    percentages: [25, 25, 25, 25],
  },
];

const TIMEFRAME_OPTIONS = [
  {
    value: 6,
    label: "6 Months",
    description: "Shorter term, higher monthly amounts",
  },
  { value: 12, label: "12 Months", description: "Balanced payment schedule" },
  {
    value: 18,
    label: "18 Months",
    description: "Extended term, lower monthly amounts",
  },
  {
    value: 24,
    label: "24 Months",
    description: "Maximum term, minimum monthly amounts",
  },
];

const formatPrice = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);
};

export function PaymentPlanSelector({
  totalAmount,
  allowedPlans = ["full", "30-30-40", "25x4"],
  selectedPlan,
  selectedTimeframe = 12,
  onPlanChange,
  onTimeframeChange,
  className = "",
}: PaymentPlanSelectorProps) {
  const [showCalculations, setShowCalculations] = useState(false);

  // Filter payment plans based on allowed plans
  const availablePlans = DEFAULT_PAYMENT_PLAN_OPTIONS.filter((plan) =>
    allowedPlans.includes(plan.id)
  );

  const getInstallmentSchedule = (
    plan: PaymentPlanOption,
    timeframeMonths: number
  ) => {
    if (plan.id === "full") {
      return [
        {
          installmentNumber: 1,
          amount: totalAmount,
          dueDate: "Immediately",
          percentage: 100,
        },
      ];
    }

    const schedule = [];
    const monthsPerInstallment = timeframeMonths / plan.installments;

    for (let i = 0; i < plan.installments; i++) {
      const dueMonths = Math.round((i + 1) * monthsPerInstallment);
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + dueMonths);

      schedule.push({
        installmentNumber: i + 1,
        amount: totalAmount * (plan.percentages[i] / 100),
        dueDate: dueDate.toLocaleDateString("en-GB", {
          month: "short",
          year: "numeric",
        }),
        percentage: plan.percentages[i],
      });
    }

    return schedule;
  };

  const selectedPlanOption = availablePlans.find(
    (plan) => plan.id === selectedPlan
  );

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Choose Payment Plan
          </CardTitle>
          <CardDescription>
            Select how you'd like to pay for this property. Total amount:{" "}
            {formatPrice(totalAmount)}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Payment Plan Options */}
          <RadioGroup
            value={selectedPlan || ""}
            onValueChange={(value) => onPlanChange(value as PaymentPlan)}
            className="space-y-4"
          >
            {availablePlans.map((plan) => (
              <div key={plan.id} className="flex items-start space-x-3">
                <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
                <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                  <Card
                    className={`transition-all ${
                      selectedPlan === plan.id
                        ? "border-blue-500 bg-blue-50 shadow-md"
                        : "hover:border-gray-300"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-lg">{plan.name}</h4>
                          <p className="text-sm text-gray-600">
                            {plan.description}
                          </p>
                        </div>
                        <div className="text-right">
                          {selectedPlan === plan.id && (
                            <CheckCircle className="h-6 w-6 text-blue-600" />
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm">
                        <Badge variant="outline">
                          {plan.installments} payment
                          {plan.installments !== 1 ? "s" : ""}
                        </Badge>
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calculator className="h-3 w-3" />
                          {plan.percentages.join("% → ")}%
                        </div>
                      </div>

                      {plan.id === "full" && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                          <div className="flex items-center gap-1 text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            Recommended: No processing fees, immediate ownership
                            transfer
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Timeframe Selection for Installment Plans */}
          {selectedPlan && selectedPlan !== "full" && (
            <div className="space-y-4">
              <div className="border-t pt-4">
                <Label className="text-base font-medium mb-3 block">
                  Payment Timeframe
                </Label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <Button
                      key={option.value}
                      variant={
                        selectedTimeframe === option.value
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => onTimeframeChange(option.value)}
                      className="h-auto flex-col p-3"
                    >
                      <div className="flex items-center gap-1 mb-1">
                        <Calendar className="h-3 w-3" />
                        <span className="font-semibold">{option.label}</span>
                      </div>
                      <span className="text-xs opacity-75">
                        {option.description}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Payment Calculation Toggle */}
          {selectedPlan && (
            <div className="border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCalculations(!showCalculations)}
                className="w-full"
              >
                <Calculator className="h-4 w-4 mr-2" />
                {showCalculations ? "Hide" : "Show"} Payment Breakdown
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Breakdown */}
      {selectedPlan && selectedPlanOption && showCalculations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Payment Breakdown - {selectedPlanOption.name}
            </CardTitle>
            <CardDescription>
              Detailed schedule for your selected payment plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600">Total Amount</div>
                  <div className="font-bold text-lg">
                    {formatPrice(totalAmount)}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Payment Method</div>
                  <div className="font-semibold">{selectedPlanOption.name}</div>
                </div>
              </div>

              {/* Installment Schedule */}
              <div className="space-y-3">
                <h4 className="font-medium">Payment Schedule:</h4>
                {getInstallmentSchedule(
                  selectedPlanOption,
                  selectedTimeframe
                ).map((installment, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-semibold text-blue-700">
                        {installment.installmentNumber}
                      </div>
                      <div>
                        <div className="font-medium">
                          Installment {installment.installmentNumber}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due: {installment.dueDate}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatPrice(installment.amount)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {installment.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h5 className="font-medium text-blue-900 mb-2">
                  Important Notes:
                </h5>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>
                    • Payment dates are approximate and will be confirmed after
                    approval
                  </li>
                  <li>
                    • All payments must be made via bank transfer or approved
                    methods
                  </li>
                  <li>
                    • Upload payment proof within 24 hours of making payment
                  </li>
                  <li>• Late payments may incur additional charges</li>
                  <li>
                    • Contact support if you need to modify your payment
                    schedule
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
