// Este código é executado num ambiente Node.js no servidor (Netlify, Vercel, etc.)
// Ele atua como um intermediário seguro entre o seu infográfico e a API da Google.

// A função principal que lida com os pedidos recebidos.
exports.handler = async function(event, context) {
  // Apenas permite pedidos do tipo POST.
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    // Extrai os dados enviados pelo frontend (o infográfico).
    const body = JSON.parse(event.body);
    const { prompt, type } = body;

    // Acede à chave de API de forma segura a partir das variáveis de ambiente.
    // NUNCA exponha a chave no código do frontend.
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      throw new Error("A chave de API do Gemini não está configurada no servidor.");
    }

    let googleApiUrl;
    let payload;

    // Determina qual API da Google chamar com base no 'type' enviado pelo frontend.
    if (type === 'tts') {
      // Configuração para o pedido de Text-to-Speech (TTS)
      googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ parts: [{ text: `Diga de forma clara e informativa: ${prompt}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } } }
        },
        model: "gemini-2.5-flash-preview-tts"
      };
    } else {
      // Configuração para o pedido de geração de texto (padrão)
      googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;
      payload = {
        contents: [{ parts: [{ text: prompt }] }]
      };
    }

    // Faz a chamada real para a API da Google a partir do servidor.
    const response = await fetch(googleApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      // Se a Google API retornar um erro, reenvia essa informação.
      const errorBody = await response.text();
      console.error('Erro da API da Google:', errorBody);
      return { statusCode: response.status, body: `Erro ao comunicar com a API da Google: ${errorBody}` };
    }

    // Obtém a resposta da Google.
    const data = await response.json();

    // Envia a resposta de volta para o frontend.
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    // Em caso de qualquer outro erro, regista-o e envia uma resposta de erro.
    console.error('Erro na função serverless:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
