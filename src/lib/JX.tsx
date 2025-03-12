const postRequest = async (
  url: string,
  body: any,
  options: { headers?: any; raw?: boolean } = {}
) => {
  const { headers = {}, raw = false } = options;
  let isJSON = true;

  if (headers) {
    const contentType =
      headers["Content-Type"] || "application/json; charset=UTF-8";
    isJSON = /json/i.test(contentType);
    headers["Content-Type"] = contentType;
  }

  const formattedBody =
    typeof body === "object" ? JSON.stringify(body) : body;

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: formattedBody,
    redirect: "follow",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Erro na requisição: ${response.statusText}`);
  }

  return raw
    ? response
    : isJSON
      ? await response.json()
      : await response.text();
};

const parseCustomDate = (dateString: string): string | null => {
  const regex = /^(\d{2})(\d{2})(\d{4})/; // Captura dia, mês e ano
  const match = dateString?.match(regex);

  if (!match) return null;

  const [, day, month, year] = match.map(Number);
  const date = new Date(year, month - 1, day); // Cria o objeto Date
  return date.toISOString(); // Retorna no formato ISO (pode ajustar se preferir outro)
};

const parseQueryResponse = (response: any) => {
  let parsedData =
    typeof response === "string" ? JSON.parse(response) : response;

  parsedData = parsedData.data?.responseBody || parsedData.responseBody || {};
  const fields = parsedData.fieldsMetadata || [];
  const rows = parsedData.rows || [];

  return rows.map((row: any) =>
    fields.reduce((acc: any, field: any, i: number) => {
      let value = row[i];

      // Verifica se o campo é uma string no formato de data (DDMMYYYY)
      if (typeof value === "string" && /^\d{8}/.test(value)) {
        const parsedDate = parseCustomDate(value);
        value = parsedDate || value; // Mantém o valor original se falhar
      }

      return { ...acc, [field.name]: value };
    }, {})
  );
};

const fetchQuery = async (queryText: string) => {
  if (!queryText) throw new Error("Query não pode estar vazia.");

  const formattedQuery = queryText.replace(/(\r\n|\n|\r)/gm, "");
  const url = `${window.location.origin}/mge/service.sbr?serviceName=DbExplorerSP.executeQuery&outputType=json`;
  const body = {
    serviceName: "DbExplorerSP.executeQuery",
    requestBody: { sql: formattedQuery },
  };

  const response = await postRequest(url, body);
  return parseQueryResponse(response);
};


export { fetchQuery };