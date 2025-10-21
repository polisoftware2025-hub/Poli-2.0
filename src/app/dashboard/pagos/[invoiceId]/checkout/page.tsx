
"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, DollarSign, Lock, Landmark, Wifi, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";


// --- Card SVG Logos ---
const VisaLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 38 24" fill="none">
    <path d="M35.19 3.522H2.81C1.26 3.522 0 4.782 0 6.333V17.67c0 1.55 1.26 2.81 2.81 2.81h32.38c1.55 0 2.81-1.26 2.81-2.81V6.333c0-1.55-1.26-2.811-2.81-2.811z" fill="#fff"/>
    <path d="M12.933 16.33H9.402L7.332 7.67h3.42l1.23 5.42.15.75h.075l.766-3.75 2.22-6.42H18.6L14.7 16.33h-1.767zM24.717 7.67h-2.58l-2.07 8.66h3.42l.345-1.5H26.3l.24 1.5h3.405l-2.22-8.66zm-1.26 5.82l.765-3.885.105.51.615 3.375h-1.485zM35.19 11.235c0-.585-.24-1.02-.87-1.275l.9-3.285H31.8l-.84 3.285h-1.62V7.67h-3.42v8.66h5.31c1.515 0 2.4-1.095 2.4-2.505v-.585zm-3.51-.555h-1.785v-1.77h1.785a.862.862 0 0 1 .93.9c0 .54-.42.945-.93.945v-.075z" fill="#1A1F71"/>
  </svg>
);

const MasterCardLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 38 24" fill="none">
    <circle cx="12" cy="12" r="12" fill="#EB001B"/>
    <circle cx="26" cy="12" r="12" fill="#F79E1B" fillOpacity="0.8"/>
  </svg>
);

const AmexLogo = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="10" rx="2" ry="2" fill="#006FCF"/>
      <rect x="9" y="10" width="6" height="4" fill="#fff"/>
    </svg>
);

const GenericCardLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
  </svg>
);

interface Invoice {
    id: string;
    ciclo: number;
    monto: number;
    estado: "pendiente" | "pagado" | "vencido" | "incompleta" | "pendiente-validacion";
    fechaGeneracion: Timestamp;
    fechaMaximaPago: Timestamp;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
};

const cardSchema = z.object({
  cardName: z.string().min(3, "Nombre inválido").refine(val => val.trim().split(' ').length >= 2, "Debe incluir nombre y apellido."),
  cardNumber: z.string().min(15, "Número de tarjeta inválido").max(19, "Número de tarjeta inválido").regex(/^[\d\s]+$/, "Solo números y espacios permitidos"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Formato debe ser MM/YY").refine(val => {
    const [month, year] = val.split('/');
    const expiryDate = new Date(Number(`20${year}`), Number(month));
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return expiryDate > now;
  }, "La tarjeta ha expirado."),
  cardCvc: z.string().min(3, "CVC inválido").max(4, "CVC inválido"),
});
type CardFormValues = z.infer<typeof cardSchema>;

const formatCardNumber = (num: string) => {
    if(!num) return "";
    return (num.replace(/\s/g, '').match(/.{1,4}/g) || []).join(' ');
};

const DynamicCreditCard = ({ values }: { values: Partial<CardFormValues> & { isFlipped?: boolean } }) => {
    const { cardName, cardNumber, cardExpiry, cardCvc, isFlipped } = values;

    const getCardType = (num: string = '') => {
      if (num.startsWith('4')) return <VisaLogo />;
      if (num.startsWith('5')) return <MasterCardLogo />;
      if (num.startsWith('3')) return <AmexLogo />;
      return <GenericCardLogo />;
    };

    return (
        <div className="w-full max-w-sm mx-auto perspective-1000">
            <div className={cn("relative w-full h-56 transition-transform duration-700 transform-style-3d", isFlipped && "rotate-y-180")}>
                {/* Card Front */}
                <div className="absolute w-full h-full backface-hidden rounded-xl bg-gradient-to-br from-primary via-blue-800 to-blue-900 shadow-xl p-6 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                        {getCardType(cardNumber)}
                        <Wifi className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-mono tracking-widest text-center">
                        <span>{formatCardNumber(cardNumber || "#### #### #### ####")}</span>
                    </div>
                    <div className="flex justify-between items-end text-xs uppercase">
                        <div>
                            <p className="opacity-70">Titular</p>
                            <p className="font-bold tracking-wider truncate">{cardName || "NOMBRE APELLIDO"}</p>
                        </div>
                        <div>
                            <p className="opacity-70">Expira</p>
                            <p className="font-bold tracking-wider">{cardExpiry || "MM/AA"}</p>
                        </div>
                    </div>
                </div>
                {/* Card Back */}
                <div className="absolute w-full h-full backface-hidden rounded-xl bg-gray-700 shadow-xl transform rotate-y-180 p-4 flex flex-col justify-between text-white">
                    <div className="w-full h-12 bg-black mt-4"></div>
                    <div className="flex justify-end pr-4">
                        <div className="bg-white text-black w-full text-right p-1 font-mono italic">
                            <span>{cardCvc}</span>
                        </div>
                    </div>
                     <div className="flex justify-start items-center text-xs text-gray-300 gap-2">
                        <Shield className="h-4 w-4"/>
                        <p>Secured by Poli 2.0</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- Main Checkout Page Component ---
export default function CheckoutPage() {
    const params = useParams();
    const invoiceId = params.invoiceId as string;
    const router = useRouter();
    const { toast } = useToast();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, startTransition] = useTransition();
    const [isCardFlipped, setIsCardFlipped] = useState(false);

    const methods = useForm<CardFormValues>({
        resolver: zodResolver(cardSchema),
        mode: 'onTouched',
        defaultValues: { cardName: '', cardNumber: '', cardExpiry: '', cardCvc: '' }
    });
    
    const watchedValues = methods.watch();

    useEffect(() => {
        if (!invoiceId) return;
        const fetchInvoice = async () => {
            setIsLoading(true);
            try {
                const invoiceRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos", invoiceId);
                const invoiceSnap = await getDoc(invoiceRef);

                if (!invoiceSnap.exists() || invoiceSnap.data().estado !== 'pendiente') {
                   toast({ variant: "destructive", title: "Factura no válida", description: "Esta factura no está disponible para pago." });
                   notFound();
                   return;
                }
                setInvoice({ id: invoiceSnap.id, ...invoiceSnap.data() } as Invoice);
            } catch (error) {
                console.error("Error fetching invoice:", error);
                toast({ variant: "destructive", title: "Error", description: "No se pudo cargar la factura." });
            } finally {
                setIsLoading(false);
            }
        };
        fetchInvoice();
    }, [invoiceId, toast]);
    
    const handlePayment = async () => {
        if (!invoice) return;
        
        startTransition(async () => {
            try {
                const invoiceRef = doc(db, "Politecnico/mzIX7rzezDezczAV6pQ7/pagos", invoice.id);
                await updateDoc(invoiceRef, {
                    estado: "pendiente-validacion", 
                    fechaIntentoPago: Timestamp.now()
                });
                toast({ 
                    title: "Procesando Pago", 
                    description: "Tu pago ha sido enviado para validación. Serás redirigido en breve."
                });

                setTimeout(() => {
                    router.push('/dashboard/pagos');
                }, 3000);

            } catch (error) {
                 toast({ variant: "destructive", title: "Error", description: "No se pudo procesar tu pago." });
            }
        });
    };
    
    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let value = e.target.value.replace(/\D/g, ''); 
      if (value.length > 16) value = value.slice(0, 16);
      methods.setValue('cardNumber', value, { shouldValidate: true });
    };

    const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 2) {
            value = value.slice(0, 2) + '/' + value.slice(2, 4);
        }
        methods.setValue('cardExpiry', value, { shouldValidate: true });
    };

    const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 4) value = value.slice(0, 4);
        methods.setValue('cardCvc', value, { shouldValidate: true });
    };

    if (isLoading) {
        return (
             <div className="flex flex-col gap-8 container mx-auto px-4 py-8">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full" />
             </div>
        );
    }

    if (!invoice) {
        return null;
    }

    return (
        <div className="flex flex-col gap-8 container mx-auto px-4 py-8 max-w-4xl">
            <PageHeader
                title="Pasarela de Pago"
                description="Finaliza tu pago de forma segura."
                icon={<CreditCard className="h-8 w-8 text-primary" />}
                backPath="/dashboard/pagos"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Resumen del Pedido</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center text-lg">
                            <span>Matrícula Ciclo {invoice.ciclo}</span>
                            <span className="font-bold">{formatCurrency(invoice.monto)}</span>
                        </div>
                        <div className="flex justify-between items-center text-lg font-bold text-primary">
                            <span>Total a Pagar</span>
                            <span>{formatCurrency(invoice.monto)}</span>
                        </div>
                    </CardContent>
                     <CardFooter>
                        <CardDescription className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4"/>
                            Esta es una pasarela de pago simulada. No uses datos reales.
                        </CardDescription>
                    </CardFooter>
                </Card>
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Método de Pago</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <FormProvider {...methods}>
                            <Tabs defaultValue="tarjeta" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="tarjeta"><CreditCard className="mr-2 h-4 w-4"/>Tarjeta</TabsTrigger>
                                    <TabsTrigger value="pse"><Landmark className="mr-2 h-4 w-4"/>PSE</TabsTrigger>
                                </TabsList>
                                <TabsContent value="tarjeta" className="mt-6 space-y-6">
                                    <DynamicCreditCard values={{ ...watchedValues, isFlipped: isCardFlipped }} />
                                      <form onSubmit={methods.handleSubmit(handlePayment)} className="space-y-4">
                                        <FormField control={methods.control} name="cardName" render={({ field }) => (
                                            <FormItem><Label>Nombre en la tarjeta</Label><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <FormField control={methods.control} name="cardNumber" render={({ field }) => (
                                            <FormItem><Label>Número de la tarjeta</Label><FormControl><Input placeholder="4242 4242 4242 4242" {...field} onChange={handleCardNumberChange} value={formatCardNumber(field.value)} /></FormControl><FormMessage /></FormItem>
                                        )}/>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <FormField control={methods.control} name="cardExpiry" render={({ field }) => (
                                                    <FormItem><Label>Fecha de Expiración</Label><FormControl><Input placeholder="MM/AA" {...field} onChange={handleExpiryChange} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                            <div className="space-y-2">
                                                <FormField control={methods.control} name="cardCvc" render={({ field }) => (
                                                    <FormItem><Label>CVC</Label><FormControl><Input placeholder="123" {...field} onChange={handleCvcChange} onFocus={() => setIsCardFlipped(true)} onBlur={() => setIsCardFlipped(false)} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={isProcessing || !methods.formState.isValid} className="w-full mt-4" size="lg">
                                            <Lock className="mr-2 h-4 w-4" />
                                            {isProcessing ? "Procesando..." : `Pagar ${formatCurrency(invoice.monto)}`}
                                        </Button>
                                      </form>
                                </TabsContent>
                                <TabsContent value="pse" className="mt-6">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="person-type">Tipo de persona</Label>
                                            <Select>
                                                <SelectTrigger id="person-type"><SelectValue placeholder="Selecciona..."/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="natural">Persona Natural</SelectItem>
                                                    <SelectItem value="juridica">Persona Jurídica</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                         <div className="space-y-2">
                                            <Label htmlFor="bank">Banco</Label>
                                            <Select>
                                                <SelectTrigger id="bank"><SelectValue placeholder="Selecciona tu banco..."/></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bancolombia">Bancolombia</SelectItem>
                                                    <SelectItem value="davivienda">Davivienda</SelectItem>
                                                    <SelectItem value="bbva">BBVA</SelectItem>
                                                    <SelectItem value="nequi">Nequi</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="pse-email">Correo electrónico</Label>
                                            <Input id="pse-email" type="email" placeholder="tu.correo@example.com"/>
                                        </div>
                                         <Button onClick={handlePayment} disabled={isProcessing} className="w-full mt-4" size="lg">
                                            <Landmark className="mr-2 h-4 w-4" />
                                            {isProcessing ? "Redirigiendo..." : "Pagar con PSE"}
                                         </Button>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </FormProvider>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
