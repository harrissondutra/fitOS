'use client';

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CostCategory, CostService, CostEntry } from "@/types/costs";
import { useCosts } from "../_hooks/use-costs";
import { useEffect, useMemo, useState } from "react";

const formSchema = z.object({
  categoryId: z.string().min(1, { message: "Category is required." }),
  serviceId: z.string().min(1, { message: "Service is required." }),
  amount: z.coerce.number().min(0.01, { message: "Amount must be positive." }),
  date: z.date({ required_error: "Date is required." }),
  description: z.string().optional(),
  tags: z.string().optional(), // Comma separated tags
  tenantId: z.string().optional(),
  clientId: z.string().optional(),
  revenueGenerated: z.coerce.number().optional(),
});

interface CostEntryFormProps {
  initialData?: Partial<CostEntry>;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CostEntryForm({ initialData, onSuccess, onCancel }: CostEntryFormProps) {
  const { getCategories, getServices, createCostEntry, updateCostEntry } = useCosts();
  const [categories, setCategories] = useState<CostCategory[]>([]);
  const [services, setServices] = useState<CostService[]>([]);
  const [loading, setLoading] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      categoryId: initialData?.categoryId || "",
      serviceId: initialData?.serviceId || "",
      amount: initialData?.amount || 0,
      date: initialData?.date ? new Date(initialData.date) : new Date(),
      description: initialData?.description || "",
      tags: initialData?.tags?.join(", ") || "",
      tenantId: initialData?.tenantId || "",
      clientId: initialData?.clientId || "",
      revenueGenerated: initialData?.revenueGenerated || 0,
    },
  });

  const selectedCategoryId = form.watch("categoryId");
  
  // Carregar categorias e serviços
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [categoriesData, servicesData] = await Promise.all([
          getCategories(),
          getServices(selectedCategoryId)
        ]);
        setCategories(categoriesData);
        setServices(servicesData);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [getCategories, getServices, selectedCategoryId]);

  useEffect(() => {
    if (selectedCategoryId && !services.some(s => s.id === form.getValues("serviceId"))) {
      form.setValue("serviceId", ""); // Reset service if category changes and old service is not in new category
    }
  }, [selectedCategoryId, services, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setLoading(true);
      const dataToSubmit = {
        ...values,
        date: values.date.toISOString(),
        tags: values.tags ? values.tags.split(',').map(tag => tag.trim()) : [],
      };

      if (initialData?.id) {
        await updateCostEntry(initialData.id, dataToSubmit);
      } else {
        await createCostEntry(dataToSubmit);
      }
      onSuccess();
    } catch (error) {
      console.error("Failed to save cost entry:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">
        {initialData?.id ? 'Edit Cost Entry' : 'Add Cost Entry'}
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="serviceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCategoryId || loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a service" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        <div className="flex items-center gap-2">
                          <span>{service.displayName}</span>
                          <span className="text-xs text-muted-foreground">
                            ({service.captureType === 'manual' ? 'Manual' : 'Automático'})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Amount (BRL)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="cliente-A, projeto-X, teste" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tenantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant ID (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client ID (optional)</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="revenueGenerated"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Revenue Generated (optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              {initialData?.id ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}