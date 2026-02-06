import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  Button,
  Card,
  FormLayout,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { login } from "../../shopify.server";

import { loginErrorMessage } from "./error.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  // Check if this is an embedded app request (has shop domain in headers or query params)
  const url = new URL(request.url);
  const shopFromQuery = url.searchParams.get("shop");
  const shopFromHeader = request.headers.get("X-Shopify-Shop-Domain");
  
  // If we have a shop domain (from query or header), let login() handle OAuth automatically
  // The login() function will automatically redirect to OAuth if shop is present
  // This prevents showing the manual login form in embedded apps when sessions expire
  if (shopFromQuery || shopFromHeader) {
    const loginResult = await login(request);
    // If login() returns a redirect (Response), throw it so Remix handles the redirect
    if (loginResult instanceof Response) {
      throw loginResult;
    }
    // Otherwise, continue with error handling
    const errors = loginErrorMessage(loginResult);
    return { errors, polarisTranslations };
  }

  // No shop domain found - show manual login form (for non-embedded apps or initial setup)
  const errors = loginErrorMessage(await login(request));

  return { errors, polarisTranslations };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // Check if this is an embedded app request (has shop domain in form data or headers)
  const formData = await request.formData();
  const shopFromForm = formData.get("shop")?.toString();
  const shopFromHeader = request.headers.get("X-Shopify-Shop-Domain");
  
  // If we have a shop domain, let login() handle OAuth
  if (shopFromForm || shopFromHeader) {
    const loginResult = await login(request);
    // If login() returns a redirect (Response), return it
    if (loginResult instanceof Response) {
      throw loginResult;
    }
    // Otherwise, continue with error handling
    const errors = loginErrorMessage(loginResult);
    return { errors };
  }

  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <PolarisAppProvider i18n={loaderData.polarisTranslations}>
      <Page>
        <Card>
          <Form method="post">
            <FormLayout>
              <Text variant="headingMd" as="h2">
                Log in
              </Text>
              <TextField
                type="text"
                name="shop"
                label="Shop domain"
                helpText="example.myshopify.com"
                value={shop}
                onChange={setShop}
                autoComplete="on"
                error={errors.shop}
              />
              <Button submit>Log in</Button>
            </FormLayout>
          </Form>
        </Card>
      </Page>
    </PolarisAppProvider>
  );
}
