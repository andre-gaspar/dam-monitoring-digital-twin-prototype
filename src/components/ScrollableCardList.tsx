"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3Icon } from "lucide-react";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type SensorItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  badge?: string;
  lat: number;
  lon: number;
};

type ScrollableCardSidebarProps = {
  items: SensorItem[];
  onCardClick?: (sensor: SensorItem) => void;
  onDataClick?: (sensor: SensorItem) => void;
  showImages?: boolean;
  selectLabel?: string;
  dataLabel?: string;
};

export function ScrollableCardSidebar({
  items,
  onCardClick,
  onDataClick,
  showImages = true,
  selectLabel = "Select",
  dataLabel = "Data",
}: ScrollableCardSidebarProps) {
  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="flex flex-col items-start gap-3 p-2">
        {items.map((item) => (
          <Card
            key={item.id}
            className={
              showImages
                ? "relative w-full max-w-sm overflow-hidden pt-0"
                : "relative w-full max-w-sm overflow-hidden gap-3 py-4"
            }
          >
            {showImages ? (
              <>
                <div className="absolute inset-x-0 top-0 z-30 aspect-video bg-black/15" />

                <img
                  src={item.image}
                  alt={item.title}
                  className="relative z-20 aspect-video w-full object-cover brightness-90 dark:brightness-75"
                />
              </>
            ) : null}

            <CardHeader className={showImages ? undefined : "gap-1 px-4"}>
              <CardAction>
                {item.badge ? (
                  <Badge variant="secondary">{item.badge}</Badge>
                ) : null}
              </CardAction>

              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>

            <CardFooter className={showImages ? "gap-2" : "gap-2 px-4"}>
              <Button className="flex-1" onClick={() => onCardClick?.(item)}>
                {selectLabel}
              </Button>
              {onDataClick ? (
                <Button
                  className="flex-1"
                  variant="secondary"
                  onClick={() => onDataClick(item)}
                >
                  <BarChart3Icon className="size-4" />
                  {dataLabel}
                </Button>
              ) : null}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
