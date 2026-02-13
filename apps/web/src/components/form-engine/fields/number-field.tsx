'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from '@/components/ui/form';
import type { FieldMetadata } from '@sepenatural/shared';

interface NumberFieldProps {
    field: FieldMetadata;
}

export function NumberField({ field }: NumberFieldProps) {
    const form = useFormContext();

    return (
        <FormField
            control={form.control}
            name={field.key}
            render={({ field: formField }) => (
                <FormItem>
                    <FormLabel>
                        {field.label}
                        {field.validation?.required && <span className="text-destructive ml-1">*</span>}
                    </FormLabel>
                    <FormControl>
                        <div className="relative">
                            {field.prefix && (
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                    {field.prefix}
                                </span>
                            )}
                            <Input
                                type="number"
                                step={field.type === 'currency' || field.type === 'decimal' || field.type === 'percentage' ? '0.01' : '1'}
                                placeholder={field.placeholder}
                                disabled={field.disabled}
                                className={`${field.prefix ? 'pl-8' : ''} ${field.suffix ? 'pr-8' : ''}`}
                                {...formField}
                                value={formField.value ?? ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    formField.onChange(value === '' ? '' : Number(value));
                                }}
                            />
                            {field.suffix && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                    {field.suffix}
                                </span>
                            )}
                        </div>
                    </FormControl>
                    {field.helpText && <FormDescription>{field.helpText}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
