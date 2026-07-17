'use client';

import { ChevronDown } from 'lucide-react';

import { Button } from '@/shared/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/shared/components/ui/collapsible';
import { Label } from '@/shared/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { cn } from '@/shared/lib/utils';

import type {
  AccountType,
  AmountMode,
  ColumnMapping,
  CsvToQboLabels,
  QboOptions,
} from './types';

interface ColumnMappingFormProps {
  headers: string[];
  mapping: ColumnMapping;
  options: QboOptions;
  labels: CsvToQboLabels;
  errorMessage?: string | null;
  isSubmitting?: boolean;
  onMappingChange: (mapping: ColumnMapping) => void;
  onOptionsChange: (options: QboOptions) => void;
  onSubmit: () => void;
  onBack: () => void;
  className?: string;
}

function ColumnSelect({
  id,
  label,
  value,
  headers,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  headers: string[];
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {headers.map((header) => (
            <SelectItem key={header} value={header}>
              {header}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function ColumnMappingForm({
  headers,
  mapping,
  options,
  labels,
  errorMessage,
  isSubmitting,
  onMappingChange,
  onOptionsChange,
  onSubmit,
  onBack,
  className,
}: ColumnMappingFormProps) {
  return (
    <div className={cn('mx-auto w-full max-w-3xl px-4', className)}>
      <div className="border-border rounded-xl border bg-muted/30 p-6">
        <h2 className="text-foreground text-lg font-semibold">{labels.mapping_title}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{labels.mapping_description}</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <ColumnSelect
            id="date-column"
            label={labels.column_date}
            value={mapping.dateColumn}
            headers={headers}
            placeholder={labels.select_column}
            onChange={(dateColumn) => onMappingChange({ ...mapping, dateColumn })}
          />
          <ColumnSelect
            id="description-column"
            label={labels.column_description}
            value={mapping.descriptionColumn}
            headers={headers}
            placeholder={labels.select_column}
            onChange={(descriptionColumn) =>
              onMappingChange({ ...mapping, descriptionColumn })
            }
          />
        </div>

        <div className="mt-4 space-y-2">
          <Label>{labels.column_amount}</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={mapping.amountMode === 'single' ? 'default' : 'outline'}
              onClick={() =>
                onMappingChange({
                  ...mapping,
                  amountMode: 'single' as AmountMode,
                })
              }
            >
              {labels.amount_mode_single}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mapping.amountMode === 'split' ? 'default' : 'outline'}
              onClick={() =>
                onMappingChange({
                  ...mapping,
                  amountMode: 'split' as AmountMode,
                })
              }
            >
              {labels.amount_mode_split}
            </Button>
          </div>
        </div>

        {mapping.amountMode === 'single' ? (
          <div className="mt-4">
            <ColumnSelect
              id="amount-column"
              label={labels.column_amount}
              value={mapping.amountColumn ?? ''}
              headers={headers}
              placeholder={labels.select_column}
              onChange={(amountColumn) =>
                onMappingChange({ ...mapping, amountColumn })
              }
            />
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ColumnSelect
              id="debit-column"
              label={labels.column_debit}
              value={mapping.debitColumn ?? ''}
              headers={headers}
              placeholder={labels.select_column}
              onChange={(debitColumn) => onMappingChange({ ...mapping, debitColumn })}
            />
            <ColumnSelect
              id="credit-column"
              label={labels.column_credit}
              value={mapping.creditColumn ?? ''}
              headers={headers}
              placeholder={labels.select_column}
              onChange={(creditColumn) => onMappingChange({ ...mapping, creditColumn })}
            />
          </div>
        )}

        <Collapsible className="mt-6">
          <CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm font-medium">
            <ChevronDown className="size-4" />
            {labels.advanced_options}
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="account-type">{labels.account_type}</Label>
              <Select
                value={options.accountType}
                onValueChange={(accountType) =>
                  onOptionsChange({
                    ...options,
                    accountType: accountType as AccountType,
                  })
                }
              >
                <SelectTrigger id="account-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">
                    {labels.account_type_checking}
                  </SelectItem>
                  <SelectItem value="CREDITCARD">
                    {labels.account_type_creditcard}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{labels.currency}</Label>
              <Select
                value={options.currency}
                onValueChange={(currency) => onOptionsChange({ ...options, currency })}
              >
                <SelectTrigger id="currency" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="CAD">CAD</SelectItem>
                  <SelectItem value="AUD">AUD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="bank-name">{labels.bank_name}</Label>
              <Select
                value={options.bankName}
                onValueChange={(bankName) => onOptionsChange({ ...options, bankName })}
              >
                <SelectTrigger id="bank-name" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV Import">CSV Import</SelectItem>
                  <SelectItem value="Chase">Chase</SelectItem>
                  <SelectItem value="Bank of America">Bank of America</SelectItem>
                  <SelectItem value="Wells Fargo">Wells Fargo</SelectItem>
                  <SelectItem value="Citi">Citi</SelectItem>
                  <SelectItem value="Capital One">Capital One</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" variant="outline" onClick={onBack}>
              {labels.reupload}
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {labels.continue}
            </Button>
          </div>
          {errorMessage && (
            <p className="text-destructive text-sm">{errorMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
