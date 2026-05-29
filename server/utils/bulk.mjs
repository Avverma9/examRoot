export function normalizeBulkItems(body) {
  if (Array.isArray(body)) return body;
  if (body && Array.isArray(body.items)) return body.items;
  if (body && Array.isArray(body.data)) return body.data;
  return null;
}

export function formatBulkError(error) {
  const writeErrors =
    error?.writeErrors ||
    error?.result?.result?.writeErrors ||
    error?.result?.writeErrors ||
    [];

  const validationErrors =
    error?.name === "ValidationError" && error?.errors
      ? Object.values(error.errors).map((e) => ({
          type: "validation",
          path: e.path,
          message: e.message,
        }))
      : [];

  const bulkWriteErrors = Array.isArray(writeErrors)
    ? writeErrors.map((e) => ({
        type: "write",
        index: e?.index,
        code: e?.code,
        message: e?.errmsg || e?.message,
      }))
    : [];

  return {
    name: error?.name,
    message: error?.message,
    validationErrors,
    bulkWriteErrors,
  };
}

