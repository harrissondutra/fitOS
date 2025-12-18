'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { ArrowLeft, Building, Mail, MessageSquare, Phone, Send, User, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { toast } from 'sonner';
import { motion } from 'framer-motion';

// Schema de validação
const formSchema = z.object({
    firstName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    lastName: z.string().min(2, 'Sobrenome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido'),
    phone: z.string().min(10, 'Telefone inválido'),
    company: z.string().min(2, 'Nome da empresa é obrigatório'),
    size: z.string({
        required_error: "Selecione o tamanho da rede",
    }).min(1, 'Selecione o tamanho da rede'),
    message: z.string().min(10, 'Mensagem deve ser mais detalhada (mín. 10 caracteres)'),
});

type FormValues = z.infer<typeof formSchema>;

export default function ContactSalesPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            company: '',
            size: '',
            message: ''
        },
    });

    // Função para formatar telefone
    const formatPhone = (input: string) => {
        let value = input.replace(/\D/g, '');
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 7) {
            return `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
        } else if (value.length > 2) {
            return `(${value.slice(0, 2)}) ${value.slice(2)}`;
        }
        return value;
    };

    const onInvalid = (errors: any) => {
        console.error("Erros de validação:", errors);
        toast.error("Por favor, verifique os campos em vermelho.");
    };

    const onSubmit = async (data: FormValues) => {
        console.log('[DEBUG] Submitting form data:', data);
        setLoading(true);

        try {
            const response = await fetch('/api/contact/sales', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                setSuccess(true);
                // toast.success('Mensagem enviada com sucesso!'); // Feedback is now in Dialog
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Erro ao enviar mensagem.');
            }
        } catch (error) {
            console.error('Erro de envio:', error);
            toast.error('Não foi possível enviar sua mensagem no momento.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] py-12 px-4 sm:px-6 lg:px-8 font-sans">
            {/* Success Dialog */}
            <Dialog open={success} onOpenChange={setSuccess}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-center text-2xl font-bold flex flex-col items-center gap-4 pt-4">
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center ring-4 ring-green-50/50">
                                <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            Mensagem Recebida!
                        </DialogTitle>
                        <DialogDescription className="text-center text-base pt-2">
                            Obrigado pelo interesse, <strong>{form.getValues('firstName')}</strong>. <br />
                            Nossa equipe de especialistas entrará em contato em breve pelo email informado.
                        </DialogDescription>
                    </DialogHeader>

                    <DialogFooter className="sm:justify-center pt-4 pb-2">
                        <Button
                            type="button"
                            className="w-full sm:w-auto bg-[#1D1D1F] text-white rounded-full px-8"
                            onClick={() => router.push('/')}
                        >
                            Voltar para Home
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row items-center justify-between mb-16">
                    <div className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity mb-4 md:mb-0" onClick={() => router.push('/')}>
                        <div className="relative h-8 w-auto">
                            <img
                                src="/images/logomarca.png"
                                alt="FitOS"
                                className="h-full w-auto object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold tracking-tight">FitOS</span>
                    </div>

                    <Button variant="ghost" onClick={() => router.back()} className="text-muted-foreground hover:text-foreground rounded-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                    {/* Left Column - Copy */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="space-y-12 lg:sticky lg:top-24"
                    >
                        <div className="space-y-6">
                            <span className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                Enterprise
                            </span>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
                                Escale sua <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] to-[#059669]">
                                    Rede Fitness.
                                </span>
                            </h1>
                            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                                Tecnologia de ponta para redes de academias que buscam eficiência operacional, controle total e experiência premium para os alunos.
                            </p>
                        </div>

                        <div className="grid gap-8">
                            <Feature
                                icon={<Building className="w-6 h-6 text-primary" />}
                                title="Gestão Multi-Unidades"
                                description="Controle centralizado de todas as filiais. Metas consolidadas, relatórios unificados e gestão de acessos simplificada."
                            />
                            <Feature
                                icon={<User className="w-6 h-6 text-primary" />}
                                title="White Label Completo"
                                description="Seu aplicativo, sua marca. Personalização total da interface para fortalecer o branding da sua rede."
                            />
                            <Feature
                                icon={<MessageSquare className="w-6 h-6 text-primary" />}
                                title="Consultoria Dedicada"
                                description="Onboarding assistido, migração de dados e um gerente de contas focado no sucesso da sua operação."
                            />
                        </div>
                    </motion.div>

                    {/* Right Column - Form */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-gray-200/50 border border-gray-100"
                    >
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Fale com Vendas</h2>
                            <p className="text-gray-500">Preencha o formulário para receber um contato personalizado.</p>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="firstName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nome</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Seu nome" className="rounded-xl h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lastName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Sobrenome</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Sobrenome" className="rounded-xl h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Corporativo</FormLabel>
                                            <FormControl>
                                                <div className="relative">
                                                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                                    <Input placeholder="voce@empresa.com" className="pl-12 rounded-xl h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" {...field} />
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>WhatsApp / Telefone</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Phone className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                                        <Input
                                                            placeholder="(11) 99999-9999"
                                                            className="pl-12 rounded-xl h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all"
                                                            {...field}
                                                            onChange={(e) => {
                                                                field.onChange(formatPhone(e.target.value));
                                                            }}
                                                        />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="company"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Empresa</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Building className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                                                        <Input placeholder="Nome da Rede/Academia" className="pl-12 rounded-xl h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all" {...field} />
                                                    </div>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="size"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tamanho da Rede</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger className="rounded-xl h-12 bg-gray-50/50 border-gray-200 focus:bg-white transition-all">
                                                        <SelectValue placeholder="Selecione o número de unidades" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="1-5">1-5 Unidades</SelectItem>
                                                    <SelectItem value="6-20">6-20 Unidades</SelectItem>
                                                    <SelectItem value="21-50">21-50 Unidades</SelectItem>
                                                    <SelectItem value="50+">Mais de 50 Unidades</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="message"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Como podemos ajudar?</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Descreva seus desafios atuais e o que procura no FitOS..."
                                                    className="rounded-xl min-h-[120px] bg-gray-50/50 border-gray-200 focus:bg-white transition-all resize-none p-4"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <Button
                                    type="submit"
                                    className="w-full h-14 rounded-full text-lg font-bold bg-[#1D1D1F] hover:bg-black text-white shadow-xl shadow-gray-300/30 transition-all hover:scale-[1.01] mt-6"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                                            Enviando solicitação...
                                        </div>
                                    ) : (
                                        'Solicitar Contato Especialista'
                                    )}
                                </Button>

                                <p className="text-center text-xs text-muted-foreground mt-4">
                                    Ao enviar, você concorda com nossa Política de Privacidade. Seus dados estão seguros.
                                </p>
                            </form>
                        </Form>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

function Feature({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <div className="flex gap-5 items-start group">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-lg shadow-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100 group-hover:scale-110 transition-transform duration-300">
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-[#1D1D1F] text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground leading-relaxed text-[15px]">{description}</p>
            </div>
        </div>
    );
}
