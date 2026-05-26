export interface PayHereFormPayload {
  actionUrl: string;
  fields: Record<string, string>;
}

export function submitPayHereForm(payload: PayHereFormPayload) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = payload.actionUrl;
  form.style.display = 'none';

  Object.entries(payload.fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
}
