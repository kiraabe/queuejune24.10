import type { DisplayState, DisplayTicket, Ticket } from "@shared/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type Handler = NonNullable<DisplayTicket["currentEmployee"]>;

interface CurrentDisplayCardProps {
  display: DisplayState;
  tickets: Record<string, Ticket>;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

function HandlerSummary({
  employee,
  className,
}: {
  employee: Handler;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-primary/15 bg-primary/5 px-3 py-2",
        className,
      )}
    >
      <p className="text-xs font-medium text-primary">Handler</p>
      <p className="text-sm font-semibold text-foreground">
        {employee.fullName}
      </p>
      <p className="text-xs text-muted-foreground">
        {employee.jobTitleAmharic || employee.jobTitle}
      </p>
    </div>
  );
}

function groupWaitingByService(tickets: Record<string, Ticket>) {
  const waiting = Object.values(tickets).filter((t) => t.status === "waiting");
  const groups = waiting.reduce(
    (acc, ticket) => {
      const category = ticket.service || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(ticket);
      return acc;
    },
    {} as Record<string, Ticket[]>,
  );
  return { waitingCount: waiting.length, groups: Object.entries(groups) };
}

export default function CurrentDisplayCard({
  display,
  tickets,
}: CurrentDisplayCardProps) {
  const nextTickets = [display.next, display.nextAfter].filter(Boolean);
  const { waitingCount, groups } = groupWaitingByService(tickets);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Display State</CardTitle>
        <CardDescription>Live display board information</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
            <TabsTrigger value="current">Now Serving</TabsTrigger>
            <TabsTrigger value="next">Next</TabsTrigger>
            <TabsTrigger value="queue">Queue Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="current" className="mt-4 space-y-4">
            {display.current.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {display.current.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="space-y-3 rounded-lg border border-border bg-card p-4 md:p-6"
                  >
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Now Serving
                      </p>
                      <p className="mt-1 text-3xl font-semibold text-primary">
                        {ticket.code}
                      </p>
                    </div>
                    {ticket.ownerName && (
                      <p className="text-sm font-medium text-foreground">
                        {ticket.ownerName}
                      </p>
                    )}
                    {ticket.windowId && (
                      <p className="text-xs font-medium text-muted-foreground">
                        Window {ticket.windowId}
                      </p>
                    )}
                    <div className="space-y-2 border-t border-border pt-3">
                      <p className="text-xs text-muted-foreground">
                        Service: {ticket.service}
                      </p>
                      {ticket.currentEmployee && (
                        <HandlerSummary employee={ticket.currentEmployee} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No customer currently being served</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="next" className="mt-4 space-y-4">
            {nextTickets.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {nextTickets.map((ticket, index) => (
                  <div
                    key={ticket?.id || index}
                    className="space-y-3 rounded-lg border border-border bg-card p-4 md:p-6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {index === 0 ? "Next Ticket" : "After Next"}
                        </p>
                        <p className="mt-1 text-3xl font-semibold text-primary">
                          {ticket?.code}
                        </p>
                      </div>
                      {ticket?.currentEmployee && (
                        <HandlerSummary employee={ticket.currentEmployee} />
                      )}
                    </div>
                    <p className="border-t border-border pt-3 text-sm">
                      <span className="font-medium">Service:</span>{" "}
                      {ticket?.service}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No next tickets</EmptyState>
            )}
          </TabsContent>

          <TabsContent value="queue" className="mt-4 space-y-4">
            <p className="text-sm font-medium text-muted-foreground">
              Queue Overview ({waitingCount} waiting)
            </p>
            {waitingCount > 0 ? (
              <div className="space-y-4">
                {groups.map(([category, categoryTickets]) => (
                  <div key={category} className="space-y-2">
                    <div className="rounded-md border border-border bg-muted px-3 py-2">
                      <p className="text-sm font-semibold text-foreground">
                        {category}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {categoryTickets.length} ticket
                        {categoryTickets.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {categoryTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="rounded-md border border-border bg-card p-3 text-center transition-colors hover:bg-muted"
                        >
                          <p className="text-lg font-semibold">{ticket.code}</p>
                          {ticket.ownerName && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {ticket.ownerName}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>Queue is empty</EmptyState>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
