import { useEffect, useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';
import { LogOut, Phone } from 'lucide-react';

interface PhoneRequiredModalProps {
  open: boolean;
  onSave: (phone: string) => Promise<void>;
  onSignOut: () => Promise<void>;
}

export function PhoneRequiredModal({ open, onSave, onSignOut }: PhoneRequiredModalProps) {
  // prefill country code 55 as requested
  const [phone, setPhone] = useState('55');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    // normalize to digits only
    const cleaned = phone.replace(/\D/g, '');

    // basic validation: if starts with 55 (Brazil) require DDD (2 digits) + local number
    if (cleaned.startsWith('55')) {
      // expected 55 + DDD(2) + number(8) = 12 digits (this app expects without extra 9)
      if (cleaned.length < 12) {
        toast({
          title: 'DDD ausente ou formato inválido',
          description: 'Para números com código 55 informe também o DDD (2 dígitos) e o número, ex.: 554491235487.',
          variant: 'destructive',
        });
        return;
      }
    } else {
      // fallback minimal length for other countries
      if (!cleaned || cleaned.length < 11) {
        toast({
          title: 'Formato inválido',
          description: 'Informe o telefone no formato internacional (ex.: 554491235487).',
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      setIsSaving(true);
      await onSave(cleaned);
      toast({ title: 'Telefone salvo', description: 'Telefone salvo com sucesso. Agora verificamos sua assinatura.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast({ title: 'Erro ao salvar', description: message || 'Não foi possível salvar o telefone.', variant: 'destructive' });
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    await onSignOut();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <Card className="w-full max-w-lg border-border bg-card">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#39FF14]/10 text-[#39FF14]">
            <Phone className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-semibold text-foreground">Ative automações via WhatsApp</CardTitle>
            <CardDescription className="text-base">Insira seu telefone para utilizar nossas automações pelo WhatsApp. Informe no formato internacional sem dígitos extras — por exemplo: <strong>554491235487</strong>.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="554491235487"
            className="w-full"
          />
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="w-full h-11 bg-[#39FF14] hover:bg-[#2fe10f] text-black">
            {isSaving ? 'Salvando...' : 'Ativar automações'}
          </Button>
          <Button variant="ghost" onClick={handleSignOut} className="w-full text-muted-foreground">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default PhoneRequiredModal;
