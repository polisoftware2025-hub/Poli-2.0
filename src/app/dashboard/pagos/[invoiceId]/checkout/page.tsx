
"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useForm, useFormContext, useWatch } from "react-hook-form";
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

// --- Dynamic Credit Card Component ---
const DynamicCreditCard = () => {
    const { control } = useFormContext();
    const cardName = useWatch({ control, name: "cardName" });
    const cardNumber = useWatch({ control, name: "cardNumber" });
    const cardExpiry = useWatch({ control, name: "cardExpiry" });
    const cardCvc = useWatch({ control, name: "cardCvc" });
    const isFlipped = useWatch({ control, name: "isFlipped" });

    const formatCardNumber = (num: string) => {
        return (num.replace(/\s/g, '').match(/.{1,4}/g) || []).join(' ');
    };

    return (
        <div className="w-full max-w-sm mx-auto perspective-1000">
            <div className={cn("relative w-full h-56 transition-transform duration-700 transform-style-3d", isFlipped && "rotate-y-180")}>
                {/* Card Front */}
                <div className="absolute w-full h-full backface-hidden rounded-xl bg-gradient-to-br from-primary via-blue-800 to-blue-900 shadow-xl p-6 flex flex-col justify-between text-white">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-8 bg-yellow-400 rounded-md grid grid-cols-2 grid-rows-2 gap-px p-1">
                            <div className="bg-yellow-500 rounded-sm"></div><div className="bg-yellow-500 rounded-sm"></div><div className="bg-yellow-500 rounded-sm col-span-2"></div>
                        </div>
                        <Wifi className="h-6 w-6" />
                    </div>
                    <div className="text-2xl font-mono tracking-widest">
                        <span>{formatCardNumber(cardNumber || "#### #### #### ####")}</span>
                    </div>
                    <div className="flex justify-between items-end text-xs uppercase">
                        <div>
                            <p className="opacity-70">Titular</p>
                            <p className="font-bold tracking-wider">{cardName || "NOMBRE APELLIDO"}</p>
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

    const methods = useForm({
        defaultValues: {
            cardName: '', cardNumber: '', cardExpiry: '', cardCvc: '', isFlipped: false,
        }
    });

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
                                     <DynamicCreditCard />
                                     <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="cardName">Nombre en la tarjeta</Label>
                                            <Input id="cardName" placeholder="John Doe" {...methods.register("cardName")} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="cardNumber">Número de la tarjeta</Label>
                                            <Input id="cardNumber" placeholder="4242 4242 4242 4242" {...methods.register("cardNumber")} />
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2 col-span-2">
                                                <Label htmlFor="cardExpiry">Fecha de Expiración</Label>
                                                <Input id="cardExpiry" placeholder="MM/AA" {...methods.register("cardExpiry")} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="cardCvc">CVC</Label>
                                                <Input id="cardCvc" placeholder="123" 
                                                   {...methods.register("cardCvc")} 
                                                   onFocus={() => methods.setValue('isFlipped', true)} 
                                                   onBlur={() => methods.setValue('isFlipped', false)}
                                                />
                                            </div>
                                        </div>
                                        <Button onClick={handlePayment} disabled={isProcessing} className="w-full mt-4" size="lg">
                                        <Lock className="mr-2 h-4 w-4" />
                                        {isProcessing ? "Procesando..." : `Pagar ${formatCurrency(invoice.monto)}`}
                                        </Button>
                                     </div>
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
