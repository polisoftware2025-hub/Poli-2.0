
"use client";

import { useState, useEffect, useTransition } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, DollarSign, Lock, Landmark, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Cards, { Focused } from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';


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
  name: z.string().min(3, "Nombre inválido").refine(val => val.trim().split(' ').length >= 2, "Debe incluir nombre y apellido."),
  number: z.string().min(15, "Número de tarjeta inválido").max(19, "Número de tarjeta inválido"),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/?\d{2}$/, "Formato debe ser MM/YY").refine(val => {
    const [monthStr, yearStr] = val.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(`20${yearStr}`, 10);
    const expiryDate = new Date(year, month);
    const now = new Date();
    now.setMonth(now.getMonth());
    return expiryDate > now;
  }, "La tarjeta ha expirado."),
  cvc: z.string().min(3, "CVC inválido").max(4, "CVC inválido"),
});

type CardFormValues = z.infer<typeof cardSchema>;


// --- Main Checkout Page Component ---
export default function CheckoutPage() {
    const params = useParams();
    const invoiceId = params.invoiceId as string;
    const router = useRouter();
    const { toast } = useToast();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, startTransition] = useTransition();
    const [focus, setFocus] = useState<Focused>('');

    const form = useForm<CardFormValues>({
        resolver: zodResolver(cardSchema),
        mode: 'onTouched',
        defaultValues: { name: '', number: '', expiry: '', cvc: '' }
    });
    
    const watchedValues = form.watch();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'number') {
            formattedValue = value.replace(/[^\d]/g, '').replace(/(.{4})/g, '$1 ').trim();
            if(formattedValue.length > 19) formattedValue = formattedValue.slice(0, 19);
        } else if (name === 'expiry') {
            formattedValue = value.replace(/[^\d]/g, '');
            if (formattedValue.length > 2) {
                formattedValue = `${formattedValue.slice(0, 2)}/${formattedValue.slice(2, 4)}`;
            }
        } else if (name === 'cvc') {
            formattedValue = value.replace(/[^\d]/g, '');
        }

        form.setValue(name as keyof CardFormValues, formattedValue, { shouldValidate: true });
    };

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
                         <Tabs defaultValue="tarjeta" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="tarjeta"><CreditCard className="mr-2 h-4 w-4"/>Tarjeta</TabsTrigger>
                                <TabsTrigger value="pse"><Landmark className="mr-2 h-4 w-4"/>PSE</TabsTrigger>
                            </TabsList>
                            <TabsContent value="tarjeta" className="mt-6 space-y-6">
                                <Cards
                                    number={watchedValues.number || ''}
                                    expiry={watchedValues.expiry || ''}
                                    cvc={watchedValues.cvc || ''}
                                    name={watchedValues.name || ''}
                                    focused={focus}
                                />
                                <Form {...form}>
                                  <form onSubmit={form.handleSubmit(handlePayment)} className="space-y-4">
                                    <FormField control={form.control} name="number" render={({ field }) => (
                                        <FormItem>
                                            <Label>Número de la tarjeta</Label>
                                            <FormControl>
                                                <Input 
                                                    placeholder="4242 4242 4242 4242" 
                                                    {...field}
                                                    onChange={handleInputChange} 
                                                    onFocus={(e) => setFocus(e.target.name as Focused)}
                                                    maxLength={19}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                     <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem>
                                            <Label>Nombre en la tarjeta</Label>
                                            <FormControl>
                                                <Input 
                                                    placeholder="John Doe" 
                                                    {...field}
                                                    onFocus={(e) => setFocus(e.target.name as Focused)} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="expiry" render={({ field }) => (
                                            <FormItem>
                                                <Label>Vencimiento</Label>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="MM/YY" 
                                                        {...field}
                                                        onChange={handleInputChange}
                                                        onFocus={(e) => setFocus(e.target.name as Focused)}
                                                        maxLength={5}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="cvc" render={({ field }) => (
                                            <FormItem>
                                                <Label>CVC</Label>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="123" 
                                                        {...field}
                                                        onChange={handleInputChange}
                                                        onFocus={(e) => setFocus(e.target.name as Focused)}
                                                        maxLength={4}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </div>
                                    <Button type="submit" disabled={isProcessing || !form.formState.isValid} className="w-full mt-4" size="lg">
                                        <Lock className="mr-2 h-4 w-4" />
                                        {isProcessing ? "Procesando..." : `Pagar ${formatCurrency(invoice.monto)}`}
                                    </Button>
                                  </form>
                                </Form>
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
