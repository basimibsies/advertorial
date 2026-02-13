import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect, useActionData, useLoaderData, useNavigation, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Select,
  TextField,
  Banner,
  ChoiceList,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getProducts, type Product } from "../lib/shopify.server";
import { generateAdvertorialContent, type TemplateType, type AngleType } from "../lib/templates.server";
import { createShopifyPage } from "../lib/shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const products = await getProducts(admin);
  return json({ products, shop: session.shop });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const step = formData.get("step") as string;

  if (step === "generate") {
    const productId = formData.get("productId") as string;
    const template = formData.get("template") as TemplateType;
    const angle = formData.get("angle") as AngleType;
    const primaryColor = (formData.get("primaryColor") as string) || "#000000";

    if (!productId || !template || !angle) {
      return json(
        { error: "Please fill in all fields", step: "generate" },
        { status: 400 }
      );
    }

    // Get product details
    const products = await getProducts(admin);
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return json(
        { error: "Product not found", step: "generate" },
        { status: 400 }
      );
    }

    try {
      // Generate content
      const { title, html } = await generateAdvertorialContent({
        productTitle: product.title,
        productHandle: product.handle,
        productDescription: product.description,
        template,
        angle,
        primaryColor,
      });

      return json({
        step: "preview",
        productId,
        productTitle: product.title,
        productHandle: product.handle,
        template,
        angle,
        title,
        html,
        primaryColor,
      });
    } catch (error) {
      console.error("Generation error:", error);
      return json(
        {
          error: error instanceof Error ? error.message : "Failed to generate content",
          step: "generate",
        },
        { status: 500 }
      );
    }
  }

  if (step === "publish") {
    const productId = formData.get("productId") as string;
    const productTitle = formData.get("productTitle") as string;
    const productHandle = formData.get("productHandle") as string;
    const template = formData.get("template") as TemplateType;
    const angle = formData.get("angle") as AngleType;
    const title = formData.get("title") as string;
    const html = formData.get("html") as string;

    if (!productId || !title || !html) {
      return json(
        { error: "Missing required fields", step: "publish" },
        { status: 400 }
      );
    }

    try {
      // Create Shopify page
      const { id: shopifyPageId, url: shopifyPageUrl } = await createShopifyPage(
        admin,
        session.shop,
        title,
        html
      );

      // Save to database
      const advertorial = await prisma.advertorial.create({
        data: {
          shop: session.shop,
          productId,
          productTitle,
          productHandle,
          template,
          angle,
          title,
          content: html,
          shopifyPageId,
          shopifyPageUrl,
        },
      });

      return redirect(`/app/${advertorial.id}`);
    } catch (error) {
      console.error("Publish error:", error);
      return json(
        {
          error: error instanceof Error ? error.message : "Failed to publish page",
          step: "publish",
        },
        { status: 500 }
      );
    }
  }

  return json({ error: "Invalid step" }, { status: 400 });
};

export default function NewAdvertorial() {
  const { products, shop } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const [productId, setProductId] = useState<string>("");
  const [template, setTemplate] = useState<TemplateType>("Story");
  const [angle, setAngle] = useState<AngleType>("Pain");
  const [primaryColor, setPrimaryColor] = useState("#000000");

  const selectedProduct = products.find((p) => p.id === productId);

  // Show preview/publish step if we have generated content
  if (actionData?.step === "preview" && actionData.html) {
    return (
      <Page>
        <TitleBar title="Preview & Publish" />
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                {actionData.error && (
                  <Banner status="critical" title="Error">
                    {actionData.error}
                  </Banner>
                )}
                <BlockStack gap="300">
                  <Text variant="headingMd" as="h2">
                    {actionData.title}
                  </Text>
                  <InlineStack gap="200">
                    <Text variant="bodySm" tone="subdued">
                      Product: {actionData.productTitle}
                    </Text>
                    <Text variant="bodySm" tone="subdued">
                      Template: {actionData.template}
                    </Text>
                    <Text variant="bodySm" tone="subdued">
                      Angle: {actionData.angle}
                    </Text>
                  </InlineStack>
                </BlockStack>
                <div
                  style={{
                    border: "1px solid #e1e3e5",
                    borderRadius: "8px",
                    padding: "16px",
                    maxHeight: "600px",
                    overflow: "auto",
                  }}
                  dangerouslySetInnerHTML={{ __html: actionData.html }}
                />
                <Form method="post">
                  <input type="hidden" name="step" value="publish" />
                  <input type="hidden" name="productId" value={actionData.productId} />
                  <input type="hidden" name="productTitle" value={actionData.productTitle} />
                  <input type="hidden" name="productHandle" value={actionData.productHandle} />
                  <input type="hidden" name="template" value={actionData.template} />
                  <input type="hidden" name="angle" value={actionData.angle} />
                  <input type="hidden" name="title" value={actionData.title} />
                  <input type="hidden" name="html" value={actionData.html} />
                  <InlineStack gap="300">
                    <Button
                      submit
                      variant="primary"
                      loading={isSubmitting}
                    >
                      Publish to Shopify
                    </Button>
                    <Button
                      url="/app/new"
                      variant="plain"
                    >
                      Start Over
                    </Button>
                  </InlineStack>
                </Form>
              </BlockStack>
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
    );
  }

  return (
    <Page>
      <TitleBar title="Create New Advertorial" />
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="500">
              {actionData?.error && (
                <Banner status="critical" title="Error">
                  {actionData.error}
                </Banner>
              )}
              <Form method="post">
                <input type="hidden" name="step" value="generate" />
                <BlockStack gap="400">
                  <Text variant="headingMd" as="h2">
                    Step 1: Select Product
                  </Text>
                  <Select
                    label="Product"
                    options={[
                      { label: "Select a product", value: "" },
                      ...products.map((p) => ({
                        label: p.title,
                        value: p.id,
                      })),
                    ]}
                    value={productId}
                    onChange={setProductId}
                    name="productId"
                    required
                  />

                  <Text variant="headingMd" as="h2">
                    Step 2: Choose Template
                  </Text>
                  <ChoiceList
                    title="Template Style"
                    choices={[
                      {
                        label: "Story - Narrative-style advertorial with a compelling story arc",
                        value: "Story",
                      },
                      {
                        label: "Listicle - Numbered list format (e.g., '5 Reasons Why...')",
                        value: "Listicle",
                      },
                    ]}
                    selected={[template]}
                    onChange={(value) => setTemplate(value[0] as TemplateType)}
                  />
                  <input type="hidden" name="template" value={template} />

                  <Text variant="headingMd" as="h2">
                    Step 3: Select Angle
                  </Text>
                  <ChoiceList
                    title="Marketing Angle"
                    choices={[
                      {
                        label: "Pain - Focus on problems and pain points",
                        value: "Pain",
                      },
                      {
                        label: "Desire - Focus on aspirational benefits",
                        value: "Desire",
                      },
                      {
                        label: "Comparison - Compare to alternatives",
                        value: "Comparison",
                      },
                    ]}
                    selected={[angle]}
                    onChange={(value) => setAngle(value[0] as AngleType)}
                  />
                  <input type="hidden" name="angle" value={angle} />

                  <Text variant="headingMd" as="h2">
                    Step 4: Brand Styling (Optional)
                  </Text>
                  <TextField
                    label="Primary Color"
                    type="color"
                    value={primaryColor}
                    onChange={setPrimaryColor}
                    name="primaryColor"
                    helpText="This color will be used for CTAs and key elements"
                  />

                  <InlineStack gap="300">
                    <Button
                      submit
                      variant="primary"
                      loading={isSubmitting}
                      disabled={!productId}
                    >
                      Generate Advertorial
                    </Button>
                    <Button url="/app" variant="plain">
                      Cancel
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Form>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

