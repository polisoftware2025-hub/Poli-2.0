
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
  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12c0-2.2-1.8-4-4-4H8c-2.2 0-4 1.8-4 4v2c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4v-2z" fill="#fff" />
    <path d="M4 12V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v4" stroke="#4B5563" />
    <path d="M11 15L9 9h-1.5L10.5 15h.5zM12 15V9h1.5l1.5 6h-1.5l-1-4.5L12 15z" fill="#1A202C" />
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
      <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
      <line x1="6" y1="12" x2="8" y2="12" />
      <line x1="12" y1="12" x2="16" y2="12" />
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
  cardNumber: z.string().min(15, "Número de tarjeta inválido").max(19, "Número de tarjeta inválido"),
  cardExpiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Formato debe ser MM/AA").refine(val => {
    const [month, year] = val.split('/');
    const expiryDate = new Date(Number(`20${year}`), Number(month));
    const now = new Date();
    now.setMonth(now.getMonth() - 1);
    return expiryDate > now;
  }, "La tarjeta ha expirado."),
  cardCvc: z.string().min(3, "CVC inválido").max(4, "CVC inválido"),
});
type CardFormValues = z.infer<typeof cardSchema>;


// --- Dynamic Credit Card Component ---
const DynamicCreditCard = ({ values }: { values: Partial<CardFormValues> & { isFlipped?: boolean } }) => {
    const { cardName, cardNumber, cardExpiry, cardCvc, isFlipped } = values;

    const formatCardNumber = (num: string) => {
        return (num.replace(/\s/g, '').match(/.{1,4}/g) || []).join(' ');
    };

    const getCardType = (num: string) => {
      if (!num) return <GenericCardLogo />;
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
                        {getCardType(cardNumber || '')}
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
      let value = e.target.value.replace(/\D/g, ''); // Remove all non-digit characters
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
                            <Tabs defaultValue="tarjeta" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="tarjeta"><CreditCard className="mr-2 h-4 w-4"/>Tarjeta</TabsTrigger>
                                    <TabsTrigger value="pse"><Landmark className="mr-2 h-4 w-4"/>PSE</TabsTrigger>
                                </TabsList>
                                <TabsContent value="tarjeta" className="mt-6 space-y-6">
                                    <DynamicCreditCard values={watchedValues} />
                                    <FormProvider {...methods}>
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
                                                    <FormItem><Label>CVC</Label><FormControl><Input placeholder="123" {...field} onChange={handleCvcChange} /></FormControl><FormMessage /></FormItem>
                                                )}/>
                                            </div>
                                        </div>
                                        <Button type="submit" disabled={isProcessing || !methods.formState.isValid} className="w-full mt-4" size="lg">
                                            <Lock className="mr-2 h-4 w-4" />
                                            {isProcessing ? "Procesando..." : `Pagar ${formatCurrency(invoice.monto)}`}
                                        </Button>
                                      </form>
                                    </FormProvider>
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
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
