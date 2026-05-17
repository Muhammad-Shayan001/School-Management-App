export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    // Dynamically import the action to use the running server's code/env
    const { createNewSchool } = await import('@/app/_lib/actions/schools');
    const result = await createNewSchool(formData);
    return Response.json(result);
  } catch (e: any) {
    return Response.json({ error: e.message, stack: e.stack });
  }
}
