'use client';

import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    FormField,
    FormItem,
    FormLabel,
    FormControl,
    FormDescription,
    FormMessage,
} from '@/components/ui/form';
import type { FieldMetadata } from '@sepenatural/shared';

interface TextFieldProps {
    field: FieldMetadata;
}

export function TextField({ field }: TextFieldProps) {
    const form = useFormContext();
    const isTextarea = field.type === 'textarea';

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
                        {isTextarea ? (
                            <Textarea
                                placeholder={field.placeholder}
                                disabled={field.disabled}
                                rows={4}
                                {...formField}
                                value={formField.value ?? ''}
                            />
                        ) : (
                            <div className="relative">
                                {field.prefix && (
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        {field.prefix}
                                    </span>
                                )}
                                <Input
                                    type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
                                    placeholder={field.placeholder}
                                    disabled={field.disabled}
                                    className={field.prefix ? 'pl-8' : undefined}
                                    {...formField}
                                    value={formField.value ?? ''}
                                />
                                {field.suffix && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                                        {field.suffix}
                                    </span>
                                )}
                            </div>
                        )}
                    </FormControl>
                    {field.helpText && <FormDescription>{field.helpText}</FormDescription>}
                    <FormMessage />
                </FormItem>
            )}
        />
    );
}
