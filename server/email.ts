// SendGrid email service - integrazione blueprint javascript_sendgrid
import sgMail from '@sendgrid/mail';
import type { Order } from '@shared/schema';

const apiKey = process.env.SENDGRID_API_KEY;
if (!apiKey) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

sgMail.setApiKey(apiKey);

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    const emailData: any = {
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text || '',
      html: params.html || '',
    };

    // Aggiungi reply-to se specificato
    if (params.replyTo) {
      emailData.replyTo = params.replyTo;
    }

    await sgMail.send(emailData);
    console.log(`Email inviata con successo a ${params.to}`);
    return true;
  } catch (error: any) {
    console.error('Errore invio email SendGrid:', error);
    // Log dettagli specifici dell'errore SendGrid
    if (error.response && error.response.body && error.response.body.errors) {
      console.error('Dettagli errore SendGrid:', JSON.stringify(error.response.body.errors, null, 2));
    }
    return false;
  }
}

// Template HTML per email ordine
export function generateOrderEmailTemplate(order: Order, supplierEmail: string): string {
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const orderDate = new Date(order.orderDate).toLocaleDateString('it-IT');
  
  const itemsHtml = order.items.map(item => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 12px; border-right: 1px solid #e0e0e0;">${item.productId}</td>
      <td style="padding: 12px; border-right: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
      <td style="padding: 12px; border-right: 1px solid #e0e0e0; text-align: right;">€${item.unitPrice.toFixed(2)}</td>
      <td style="padding: 12px; text-align: right; font-weight: bold;">€${item.totalPrice.toFixed(2)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ordine FoodyFlow - ${order.id}</title>
    </head>
    <body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🍽️ FoodyFlow</h1>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Sistema di Gestione Ristorante</p>
        </div>

        <!-- Contenuto principale -->
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-top: 0; font-size: 24px;">Nuovo Ordine</h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="color: #495057; margin-top: 0; font-size: 18px;">Dettagli Ordine</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Numero Ordine:</td>
                <td style="padding: 8px 0; color: #333;">${order.id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Data Ordine:</td>
                <td style="padding: 8px 0; color: #333;">${orderDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Fornitore:</td>
                <td style="padding: 8px 0; color: #333;">${order.supplier}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Status:</td>
                <td style="padding: 8px 0;">
                  <span style="background-color: #28a745; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold;">
                    ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
              </tr>
              ${order.operatorName ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #6c757d;">Operatore:</td>
                <td style="padding: 8px 0; color: #333;">${order.operatorName}</td>
              </tr>
              ` : ''}
            </table>
          </div>

          <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Prodotti Ordinati</h3>
          
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden;">
            <thead>
              <tr style="background-color: #343a40; color: white;">
                <th style="padding: 15px; text-align: left; font-weight: bold;">Prodotto</th>
                <th style="padding: 15px; text-align: center; font-weight: bold;">Quantità</th>
                <th style="padding: 15px; text-align: right; font-weight: bold;">Prezzo Unitario</th>
                <th style="padding: 15px; text-align: right; font-weight: bold;">Totale</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="margin-top: 25px; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
              <div style="margin-bottom: 10px;">
                <span style="font-size: 16px; color: #6c757d;">Totale Articoli: </span>
                <span style="font-size: 16px; font-weight: bold; color: #333;">${totalItems}</span>
              </div>
              <div>
                <span style="font-size: 20px; color: #28a745; font-weight: bold;">Totale Ordine: €${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          ${order.notes ? `
          <div style="margin-top: 20px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px;">
            <h4 style="margin-top: 0; color: #856404; font-size: 16px;">📝 Note:</h4>
            <p style="margin-bottom: 0; color: #856404; line-height: 1.4;">${order.notes}</p>
          </div>
          ` : ''}

          <div style="margin-top: 30px; padding: 20px; background-color: #e9f7ef; border-radius: 6px; text-align: center;">
            <p style="margin: 0; color: #27ae60; font-weight: bold; font-size: 16px;">
              Grazie per la collaborazione! 🤝
            </p>
            <p style="margin: 10px 0 0 0; color: #27ae60; font-size: 14px;">
              Per qualsiasi domanda, non esitate a contattarci.
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #343a40; padding: 20px; text-align: center;">
          <p style="color: #adb5bd; margin: 0; font-size: 14px;">
            Questa email è stata generata automaticamente da FoodyFlow
          </p>
          <p style="color: #6c757d; margin: 5px 0 0 0; font-size: 12px;">
            Sistema di Gestione Ristorante - ${new Date().getFullYear()}
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Funzione per inviare email ordine
export async function sendOrderEmail(order: Order, supplierEmail: string, fromEmail = 'ordini@foodyflow.it', replyToEmail = 'ordini@foodyflow.it'): Promise<boolean> {
  if (!supplierEmail || !supplierEmail.includes('@')) {
    console.error('Email fornitore non valida:', supplierEmail);
    return false;
  }

  const subject = `Nuovo Ordine FoodyFlow #${order.id} - ${order.supplier}`;
  const html = generateOrderEmailTemplate(order, supplierEmail);
  
  // Versione testo semplificato per client che non supportano HTML
  const text = `
Nuovo Ordine FoodyFlow

Numero Ordine: ${order.id}
Fornitore: ${order.supplier}
Data: ${new Date(order.orderDate).toLocaleDateString('it-IT')}
Totale: €${order.totalAmount.toFixed(2)}

Prodotti:
${order.items.map(item => `- ${item.productId}: ${item.quantity} x €${item.unitPrice.toFixed(2)} = €${item.totalPrice.toFixed(2)}`).join('\n')}

${order.notes ? `Note: ${order.notes}` : ''}

Grazie per la collaborazione!
FoodyFlow Team

---
Per rispondere a questo ordine, rispondi a: ${replyToEmail}
  `;

  return await sendEmail({
    to: supplierEmail,
    from: fromEmail,
    replyTo: replyToEmail,
    subject,
    text,
    html
  });
}