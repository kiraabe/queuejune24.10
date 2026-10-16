import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  BadgeCheck,
  ClipboardSignature,
  Handshake,
  ShieldCheck,
  AlertCircle,
  IdCard,
  MapPin,
  Tag,
  User,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { ConsoleShell } from "@/components/layout/ConsoleShell";
import { useTranslation } from "@/hooks/use-translation";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import type {
  ServiceType,
  Ticket,
  ServiceCategory,
  ServiceItem,
} from "@shared/api";

const WOREDA_OPTIONS = [
  "Woreda 1",
  "Woreda 2",
  "Woreda 3",
  "Woreda 4",
  "Woreda 5",
  "Woreda 6",
  "Woreda 7",
  "Woreda 8",
  "Woreda 9",
  "Woreda 10",
  "Woreda 11",
  "Woreda 12",
  "Woreda 13",
] as const;

const RECEPTION_GAINS = [
  {
    icon: BadgeCheck,
    titleKey: "reception.eligibility.title",
    descriptionKey:
      "reception.eligibility.desc",
  },
  {
    icon: ShieldCheck,
    titleKey: "reception.privacy.title",
    descriptionKey:
      "reception.privacy.desc",
  },
  {
    icon: Handshake,
    titleKey: "reception.handoff.title",
    descriptionKey:
      "reception.handoff.desc",
  },
];

const SCRIPT_POINTS = [
  "Welcome and verify service eligibility",
  "Capture service selection & add context",
  "Generate QR ticket and confirm lounge instructions",
];

type CreateTicketPayload = {
  service: ServiceType;
  ownerName: string;
  woreda: string;
  serviceCategory?: string;
  selectedServices?: string[];
  landCertificateKarta?: string;
  landCertificateDigital?: string;
};

import { apiFetch } from "@/lib/api";

async function createTicketRequest(
  payload: CreateTicketPayload,
): Promise<Ticket> {
  const body = {
    service: payload.service,
    ownerName: payload.ownerName,
    woreda: payload.woreda,
    serviceCategory: payload.serviceCategory,
    selectedServices: payload.selectedServices,
    landCertificateKarta: payload.landCertificateKarta,
    landCertificateDigital: payload.landCertificateDigital,
  };
  return apiFetch<Ticket>("/api/tickets", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

type DraftDetails = {
  ownerName: string;
  woreda: string;
  service: ServiceType;
  serviceCategory?: string;
  selectedServices?: string[];
  selectedServiceNames?: string[];
  landCertificateKarta?: string;
  landCertificateDigital?: string;
};

interface TicketPreviewProps {
  ticket: Ticket | null;
  details: DraftDetails;
  selectedServiceLabel: string;
  isGenerating: boolean;
}

function TicketPreview({
  ticket,
  details,
  selectedServiceLabel,
  isGenerating,
}: TicketPreviewProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    let timer: number | undefined;
    if (!ticket) {
      setQrDataUrl(null);
      return () => {
        isActive = false;
        if (timer) window.clearInterval(timer);
      };
    }

    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const makeQr = () => {
      const statusUrl = `${origin}/tickets/${encodeURIComponent(ticket.code)}`;
      QRCode.toDataURL(statusUrl, { width: 240, margin: 1 })
        .then((url) => {
          if (isActive) setQrDataUrl(url);
        })
        .catch(() => {
          if (isActive) setQrDataUrl(null);
        });
    };

    // generate immediately and then refresh every 60s as indicated in UI
    makeQr();
    timer = window.setInterval(() => makeQr(), 60000);

    return () => {
      isActive = false;
      if (timer) window.clearInterval(timer);
    };
  }, [ticket?.code]);

  const { t } = useTranslation();

  const display = ticket
    ? {
        code: ticket.code,
        ownerName: ticket.ownerName ?? details.ownerName,
        woreda: ticket.woreda ?? details.woreda,
        selectedServiceNames: details.selectedServiceNames,
      }
    : {
        code: t("reception.autoAssigned"),
        ownerName: details.ownerName,
        woreda: details.woreda,
        selectedServiceNames: details.selectedServiceNames,
      };

  const trackingUrl = ticket
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/tickets/${ticket.code}`
    : null;
  const noteLines: string[] = [];

  return (
    <div className="rounded-xl border border-border/70 bg-muted/40 p-4 md:p-5 text-sm text-foreground">
      <p className="font-semibold text-xs sm:text-sm uppercase tracking-wide text-primary">
        {t("reception.preview")}
      </p>
      {!ticket && (
        <p className="mt-2 text-sm text-muted-foreground">
          {t("reception.previewDesc")}
        </p>
      )}
      <div className="mt-4 grid gap-5 md:grid-cols-[minmax(0,1fr)_15rem] md:gap-6">
        <div className="grid gap-3 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-muted-foreground">{t("reception.orderNo")}</span>{" "}
          <span className="font-mono text-base sm:text-lg font-bold text-primary">
            {display.code}
          </span>
        </p>
        {display.ownerName && (
          <p>
            <span className="font-medium text-muted-foreground">{t("reception.owner")}</span>{" "}
            <span className="text-foreground">{display.ownerName}</span>
          </p>
        )}
        {display.woreda && (
          <p>
            <span className="font-medium text-muted-foreground">{t("reception.woreda")}</span>{" "}
            <span className="text-foreground">{display.woreda}</span>
          </p>
        )}
        <p>
          <span className="font-medium text-muted-foreground">{t("reception.service")}</span>{" "}
          <span className="text-foreground">{selectedServiceLabel}</span>
        </p>
        {display.selectedServiceNames &&
          display.selectedServiceNames.length > 0 && (
            <div>
              <p className="font-medium text-muted-foreground mb-1">
                {t("reception.services")}
              </p>
              <ul className="ml-4 list-disc space-y-1 text-foreground text-sm">
                {display.selectedServiceNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}
        {(details.landCertificateKarta || details.landCertificateDigital) && (
          <div className="space-y-1 text-foreground text-sm">
            {details.landCertificateKarta && (
              <p>
                <span className="font-medium text-muted-foreground">
                  karta (ካርታ) ser no.:
                </span>{" "}
                {details.landCertificateKarta}
              </p>
            )}
            {details.landCertificateDigital && (
              <p>
                <span className="font-medium text-muted-foreground">
                  karta (ካርታ) No.:
                </span>{" "}
                {details.landCertificateDigital}
              </p>
            )}
          </div>
        )}
        {noteLines.length > 0 && (
          <div>
            <p className="font-medium text-muted-foreground mb-1">Notes:</p>
            <ul className="ml-4 list-disc space-y-1 text-foreground">
              {noteLines.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        )}
        {ticket && trackingUrl && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="font-medium text-muted-foreground text-xs sm:text-sm">
              {t("reception.trackingUrl")}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2">
              <a
                href={trackingUrl}
                target="_blank"
                rel="noreferrer"
                className="break-all text-xs sm:text-sm text-primary underline underline-offset-4 hover:text-primary/80 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring flex-1 sm:flex-initial"
              >
                {trackingUrl}
              </a>
              <button
                type="button"
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(trackingUrl);
                    toast.success(t("reception.toast.urlCopied"));
                  } catch {
                    try {
                      const tmp = document.createElement("textarea");
                      tmp.value = trackingUrl || "";
                      document.body.appendChild(tmp);
                      tmp.select();
                      document.execCommand("copy");
                      document.body.removeChild(tmp);
                      toast.success(t("reception.toast.urlCopied"));
                    } catch {
                      toast.error(t("reception.toast.copyFailed"));
                    }
                  }
                }}
                className="shrink-0 rounded-md bg-primary/10 px-3 sm:px-2 py-2 sm:py-1 text-xs font-medium text-primary hover:bg-primary/20 transition-colors active:bg-primary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {t("reception.copy")}
              </button>
            </div>
          </div>
        )}
        </div>
        <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-border bg-card p-4">
          {ticket ? (
            <div className="grid place-items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR code for ticket ${ticket.code}`}
                  className="h-40 w-40 md:h-44 md:w-44 rounded-md border border-border bg-white p-2"
                />
              ) : (
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-xs sm:text-sm">
                    {t("reception.generating2")}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex w-full items-center justify-center rounded-md border border-dashed border-border bg-background p-4 text-center text-muted-foreground">
              <p className="text-xs sm:text-sm">
                {t("reception.qrPlaceholder")}
              </p>
            </div>
          )}
          {isGenerating && !ticket && (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">{t("reception.generatingTicket")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Reception() {
  const { t } = useTranslation();
  const [ownerName, setOwnerName] = useState("");
  const [woreda, setWoreda] = useState("");
  const [landCertificateKarta, setLandCertificateKarta] = useState("");
  const [landCertificateDigital, setLandCertificateDigital] = useState("");
  const [service, setService] = useState<ServiceType>("");
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);
  const [lastSubmission, setLastSubmission] = useState<DraftDetails | null>(
    null,
  );
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>(
    [],
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [categoryServices, setCategoryServices] = useState<ServiceItem[]>([]);
  const [loadingCategoryServices, setLoadingCategoryServices] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set(),
  );

  // Fetch service categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/service-categories", {
          headers: {
            "X-Requested-With": "XMLHttpRequest",
          },
        });
        if (!response.ok) {
          throw new Error("Failed to load categories");
        }
        const data = await response.json();
        setServiceCategories(data.categories || []);
      } catch (error) {
        console.error("Failed to load service categories", error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch services for selected category
  useEffect(() => {
    if (!selectedCategory) {
      setCategoryServices([]);
      setSelectedServices(new Set());
      return;
    }

    const fetchCategoryServices = async () => {
      setLoadingCategoryServices(true);
      try {
        const response = await fetch(
          `/api/service-categories/${selectedCategory}/services`,
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          },
        );
        if (!response.ok) {
          throw new Error("Failed to load services");
        }
        const data = await response.json();
        setCategoryServices(data.services || []);
      } catch (error) {
        console.error("Failed to load category services", error);
        setCategoryServices([]);
      } finally {
        setLoadingCategoryServices(false);
      }
    };

    fetchCategoryServices();
  }, [selectedCategory]);

  const selectedServiceLabel = useMemo(() => {
    const categoryKey = generatedTicket?.serviceCategory ?? selectedCategory;
    const category = serviceCategories.find(
      (cat) => cat.id === categoryKey || cat.code === categoryKey,
    );
    return category?.name ?? "Not specified";
  }, [generatedTicket?.serviceCategory, selectedCategory, serviceCategories]);

  const selectedServiceNames = useMemo(() => {
    return Array.from(selectedServices)
      .map((id) => categoryServices.find((s) => s.id === id)?.name)
      .filter(Boolean) as string[];
  }, [selectedServices, categoryServices]);

  const createTicket = useMutation<Ticket, Error, CreateTicketPayload>({
    mutationFn: createTicketRequest,
    onSuccess: (ticket, variables) => {
      setGeneratedTicket(ticket);
      setLastSubmission({
        ownerName: variables.ownerName,
        woreda: variables.woreda,
        service: variables.service,
        serviceCategory: variables.serviceCategory,
        selectedServices: variables.selectedServices,
        selectedServiceNames,
        landCertificateKarta: variables.landCertificateKarta,
        landCertificateDigital: variables.landCertificateDigital,
      });
      toast.success(`Ticket ${ticket.code} generated`);
      setOwnerName("");
      setWoreda("");
      setLandCertificateKarta("");
      setLandCertificateDigital("");
      setSelectedCategory("");
      setSelectedServices(new Set());
    },
    onError: (error) => {
      const message =
        error instanceof Error ? error.message : "Unable to create ticket.";
      toast.error(message);
    },
  });

  const isFormValid =
    ownerName.trim().length > 0 &&
    woreda.length > 0 &&
    landCertificateKarta.trim().length > 0 &&
    landCertificateDigital.trim().length > 0 &&
    selectedCategory.length > 0 &&
    selectedServices.size > 0;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid || createTicket.isPending) return;

    // Get the service code from the selected category
    const selectedCategoryObj = serviceCategories.find(
      (cat) => cat.id === selectedCategory,
    );
    const serviceCode = selectedCategoryObj?.code || "rights-group"; // Default service

    // Get the first selected service name for the main service field
    const firstSelectedServiceId = Array.from(selectedServices)[0];
    const firstSelectedService = categoryServices.find((s) => s.id === firstSelectedServiceId);
    const serviceName = firstSelectedService?.name || serviceCode;

    createTicket.mutate({
      service: serviceCode,
      ownerName: ownerName.trim(),
      woreda,
      serviceCategory: serviceCode, // Use the code, not the ID, for proper window routing
      selectedServices: Array.from(selectedServices),
      landCertificateKarta: landCertificateKarta.trim(),
      landCertificateDigital: landCertificateDigital.trim(),
    });
  };

  const handleServiceCheckboxChange = (serviceId: string) => {
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);
  };

  // Get the category code for draft
  const draftCategoryCode = serviceCategories.find(
    (cat) => cat.id === selectedCategory,
  )?.code;

  const draft: DraftDetails = {
    ownerName,
    woreda,
    service,
    serviceCategory: draftCategoryCode,
    selectedServices: Array.from(selectedServices),
    selectedServiceNames,
  };
  const previewDetails =
    generatedTicket && lastSubmission ? lastSubmission : draft;

  return (
    <ConsoleShell
      title={t("reception.title")}
      className="lg:grid-cols-1"
    >
      <section className="w-full grid gap-6 py-4 md:py-6">
        <Card className="w-full rounded-xl border-border/70 bg-white shadow-sm">
          <CardHeader className="space-y-1 mb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ClipboardSignature className="h-5 w-5 text-primary shrink-0" />
              <span>{t("reception.issueTicket")}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Name and Woreda fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="owner-name" className="text-sm font-semibold text-foreground">
                    {t("reception.ownerLabel")}
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="owner-name"
                      value={ownerName}
                      onChange={(event) => setOwnerName(event.target.value)}
                      placeholder={t("reception.ownerPlaceholder")}
                      required
                      className="h-10 pl-9 bg-white border-border shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="woreda" className="text-sm font-semibold text-foreground">
                    {t("reception.woredaLabel")}
                  </Label>
                  <Select value={woreda} onValueChange={setWoreda}>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <SelectTrigger id="woreda" className="h-10 pl-9 bg-white border-border shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15">
                        <SelectValue placeholder={t("reception.woredaPlaceholder")} />
                      </SelectTrigger>
                    </div>
                    <SelectContent>
                      {WOREDA_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Land Certificate fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 gap-y-4 border-t border-border/70 pt-5">
                <div className="grid gap-2">
                  <Label
                    htmlFor="land-cert-karta"
                    className="text-sm font-semibold text-foreground"
                  >
                    karta (ካርታ) ser no.
                  </Label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="land-cert-karta"
                      value={landCertificateKarta}
                      onChange={(event) =>
                        setLandCertificateKarta(event.target.value)
                      }
                      placeholder="Enter certificate serial number"
                      required
                      className="h-10 pl-9 bg-white border-border shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label
                    htmlFor="land-cert-digital"
                    className="text-sm font-semibold text-foreground"
                  >
                    karta (ካርታ) No.
                  </Label>
                  <div className="relative">
                    <IdCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      id="land-cert-digital"
                      value={landCertificateDigital}
                      onChange={(event) =>
                        setLandCertificateDigital(event.target.value)
                      }
                      placeholder="Enter certificate number"
                      required
                      className="h-10 pl-9 bg-white border-border shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
                    />
                  </div>
                </div>
              </div>

              {/* Service Category section */}
              {serviceCategories.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 border-t border-border/70 pt-5">
                  <div className="grid gap-2">
                    <Label className="text-sm font-semibold text-foreground">
                      {t("reception.categoryLabel")}
                    </Label>
                    <Select
                      value={selectedCategory}
                      onValueChange={setSelectedCategory}
                    >
                      <div className="relative">
                        <Tag className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                        <SelectTrigger id="category" className="h-10 pl-9 bg-white border-border shadow-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15">
                          <SelectValue placeholder={t("reception.categoryPlaceholder")} />
                        </SelectTrigger>
                      </div>
                      <SelectContent>
                        {serviceCategories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Services section */}
              {selectedCategory && (
                <div className="space-y-3 border-t border-border pt-5">
                  <Label className="text-sm font-semibold text-foreground">{t("reception.servicesLabel")}</Label>
                  {loadingCategoryServices ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">{t("reception.loadingServices")}</span>
                    </div>
                  ) : categoryServices.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t("reception.noServices")}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="rounded-lg border border-border bg-card p-4">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {categoryServices.map((svc) => (
                          <div key={svc.id} className="flex items-start gap-3">
                            <Checkbox
                              id={svc.id}
                              checked={selectedServices.has(svc.id)}
                              onCheckedChange={() =>
                                handleServiceCheckboxChange(svc.id)
                              }
                              className="mt-1"
                            />
                            <Label
                              htmlFor={svc.id}
                              className="font-normal cursor-pointer"
                            >
                              {svc.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ticket preview */}
              <TicketPreview
                ticket={generatedTicket}
                details={previewDetails}
                selectedServiceLabel={selectedServiceLabel}
                isGenerating={createTicket.isPending}
              />

              {/* Submit button */}
              <Button
                type="submit"
                className="h-11 w-full bg-primary text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                disabled={!isFormValid || createTicket.isPending}
              >
                {createTicket.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("reception.generating")}</span>
                  </span>
                ) : (
                  t("reception.generateBtn")
                )}
              </Button>
              <p className="text-center text-xs sm:text-sm text-muted-foreground">
                {t("reception.autoRefresh")}
              </p>
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="w-full border-t border-border bg-muted py-8 md:py-12 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {RECEPTION_GAINS.map((item) => (
            <Card key={item.titleKey}>
              <CardHeader className="space-y-3 mb-4">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary shrink-0">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {t(item.titleKey as any)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-xs sm:text-sm leading-relaxed text-muted-foreground">
                  {t(item.descriptionKey as any)}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </ConsoleShell>
  );
}
