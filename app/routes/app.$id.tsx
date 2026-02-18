import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect, useLoaderData, useActionData, useNavigation, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  Badge,
  Banner,
  TextField,
  Modal,
  Box,
} from "@shopify/polaris";
import { useAppBridge } from "@shopify/app-bridge-react";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { getPrimaryDomain, updateShopifyPage } from "../lib/shopify.server";
import prisma from "../db.server";
import { renderBlocksToHtml } from "../lib/block-renderer";
import type { Block } from "../lib/blocks";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const { id } = params;

  if (!id) {
    throw new Response("Not Found", { status: 404 });
  }

  const advertorial = await prisma.advertorial.findFirst({
    where: {
      id,
      shop: session.shop,
    },
  });

  if (!advertorial) {
    throw new Response("Not Found", { status: 404 });
  }

  // Ensure live page URL uses the shop's primary/custom domain
  const primaryDomain = await getPrimaryDomain(admin, session.shop);
  const livePageUrl = advertorial.shopifyPageUrl?.startsWith("http")
    ? advertorial.shopifyPageUrl
    : advertorial.shopifyPageUrl
      ? `${primaryDomain}${advertorial.shopifyPageUrl.startsWith("/") ? "" : "/"}${advertorial.shopifyPageUrl}`
      : null;

  return json({ advertorial: { ...advertorial, livePageUrl } });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "update-page") {
    const { id } = params;
    if (!id) return json({ error: "Missing ID" }, { status: 400 });
    const advertorial = await prisma.advertorial.findFirst({
      where: { id, shop: session.shop },
    });
    if (!advertorial) return json({ error: "Not found" }, { status: 404 });
    if (!advertorial.shopifyPageId) {
      return json({ error: "No published page to update" }, { status: 400 });
    }
    try {
      const blocks = (advertorial.blocks ? JSON.parse(advertorial.blocks as string) : []) as Block[];
      const primaryColor = "#22c55e";
      const html =
        blocks.length > 0
          ? renderBlocksToHtml(blocks, {
              primaryColor,
              productTitle: advertorial.productTitle,
              productHandle: advertorial.productHandle,
            })
          : advertorial.content;
      await updateShopifyPage(admin, session.shop, advertorial.shopifyPageId, advertorial.title, html);
      return json({ success: true, message: "Page updated on Shopify." });
    } catch (e) {
      console.error("Error updating Shopify page:", e);
      return json({ error: "Failed to update page" }, { status: 500 });
    }
  }

  if (intent === "delete") {
    const { id } = params;

    if (!id) {
      return json({ error: "Missing ID" }, { status: 400 });
    }

    const advertorial = await prisma.advertorial.findFirst({
      where: { id, shop: session.shop },
    });

    if (!advertorial) {
      return json({ error: "Advertorial not found" }, { status: 404 });
    }

    // Delete the Shopify page if it exists
    if (advertorial.shopifyPageId) {
      try {
        await admin.graphql(
          `#graphql
            mutation pageDelete($id: ID!) {
              pageDelete(id: $id) {
                deletedPageId
                userErrors {
                  field
                  message
                }
              }
            }`,
          { variables: { id: advertorial.shopifyPageId } },
        );
      } catch (error) {
        console.error("Error deleting Shopify page:", error);
        // Continue with DB deletion even if Shopify page deletion fails
      }
    }

    // Delete from database
    await prisma.advertorial.delete({
      where: { id },
    });

    return redirect("/app");
  }

  return json({ error: "Invalid action" }, { status: 400 });
};

export default function AdvertorialDetail() {
  const { advertorial } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const appBridge = useAppBridge();
  const [copied, setCopied] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const isUpdatingPage = navigation.state === "submitting" && navigation.formData?.get("intent") === "update-page";

  const isDeleting = navigation.state === "submitting" && navigation.formData?.get("intent") === "delete";
  const canDelete = deleteConfirmation.toLowerCase() === "delete";

  const liveUrl = (advertorial as { livePageUrl?: string | null }).livePageUrl ?? advertorial.shopifyPageUrl;

  const copyUrl = () => {
    if (liveUrl) {
      navigator.clipboard.writeText(liveUrl);
      setCopied(true);
      appBridge.toast.show("URL copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Page>
      <TitleBar title={advertorial.title}>
        {liveUrl && (
          <InlineStack gap="200">
            <Button
              url={liveUrl}
              target="_blank"
              variant="primary"
            >
              View Live Page
            </Button>
            <Form method="post">
              <input type="hidden" name="intent" value="update-page" />
              <Button submit variant="secondary" loading={isUpdatingPage}>
                Update page on Shopify
              </Button>
            </Form>
          </InlineStack>
        )}
      </TitleBar>
      <Layout>
        <Layout.Section>
          {actionData && "success" in actionData && actionData.success && (
            <Banner tone="success" onDismiss={() => {}}>
              Page updated on Shopify.
            </Banner>
          )}
          {actionData && "error" in actionData && actionData.error && (
            <Banner tone="critical" onDismiss={() => {}}>
              {actionData.error}
            </Banner>
          )}
          <Card>
            <BlockStack gap="500">
              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text variant="headingLg" as="h1">
                    {advertorial.title}
                  </Text>
                  <InlineStack gap="200">
                    <Badge>{advertorial.template}</Badge>
                    <Badge tone="info">{advertorial.angle}</Badge>
                  </InlineStack>
                </InlineStack>
                <Text variant="bodyMd" tone="subdued" as="p">
                  Product: {advertorial.productTitle}
                </Text>
                {liveUrl ? (
                  <Banner tone="success" title="Published">
                    <p>
                      This advertorial has been published.{" "}
                      <a
                        href={liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View live page
                      </a>
                    </p>
                  </Banner>
                ) : (
                  <Banner tone="warning" title="Not Published">
                    <p>This advertorial has not been published yet.</p>
                  </Banner>
                )}
              </BlockStack>
              <div
                style={{
                  border: "1px solid #e1e3e5",
                  borderRadius: "8px",
                  padding: "16px",
                  backgroundColor: "#fff",
                }}
                dangerouslySetInnerHTML={{ __html: advertorial.content }}
              />
              {liveUrl && (
                <BlockStack gap="300">
                  <Text variant="bodyMd" fontWeight="medium" as="p">
                    Live URL (copy to use in ads):
                  </Text>
                  <InlineStack gap="200" blockAlign="center">
                    <div style={{ flex: 1 }}>
                      <TextField
                        label=""
                        value={liveUrl}
                        readOnly
                        autoComplete="off"
                      />
                    </div>
                    <Button onClick={copyUrl} variant="secondary">
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </InlineStack>
                </BlockStack>
              )}
              <InlineStack gap="300">
                {liveUrl && (
                  <Button
                    url={liveUrl}
                    target="_blank"
                    variant="primary"
                  >
                    View Live Page
                  </Button>
                )}
                <Button url="/app" variant="plain">
                  Back to List
                </Button>
              </InlineStack>
            </BlockStack>
          </Card>
        </Layout.Section>
        <Layout.Section variant="oneThird">
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Details
                </Text>
                <BlockStack gap="200">
                  <Text variant="bodySm" tone="subdued" as="span">
                    Created: {new Date(advertorial.createdAt).toLocaleString()}
                  </Text>
                  <Text variant="bodySm" tone="subdued" as="span">
                    Updated: {new Date(advertorial.updatedAt).toLocaleString()}
                  </Text>
                  {advertorial.shopifyPageId && (
                    <Text variant="bodySm" tone="subdued" as="span">
                      Shopify Page ID: {advertorial.shopifyPageId}
                    </Text>
                  )}
                </BlockStack>
              </BlockStack>
            </Card>

            {/* Delete card */}
            <Card>
              <BlockStack gap="300">
                <Text variant="headingMd" as="h2">
                  Danger zone
                </Text>
                <Text variant="bodySm" tone="subdued" as="p">
                  Permanently delete this advertorial{liveUrl ? " and its published Shopify page" : ""}.
                  This action cannot be undone.
                </Text>
                <Button
                  tone="critical"
                  variant="primary"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Delete advertorial
                </Button>
              </BlockStack>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>

      {/* Delete confirmation modal */}
      {deleteModalOpen && (
        <Modal
          open={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setDeleteConfirmation("");
          }}
          title="Delete advertorial"
          primaryAction={{
            content: isDeleting ? "Deleting..." : "Delete permanently",
            destructive: true,
            disabled: !canDelete || isDeleting,
            onAction: () => {
              // Submit the hidden form programmatically
              const form = document.getElementById("delete-form") as HTMLFormElement;
              if (form) form.requestSubmit();
            },
          }}
          secondaryActions={[
            {
              content: "Cancel",
              onAction: () => {
                setDeleteModalOpen(false);
                setDeleteConfirmation("");
              },
            },
          ]}
        >
          <Modal.Section>
            <BlockStack gap="400">
              <Text as="p">
                This will permanently delete <strong>{advertorial.title}</strong>
                {liveUrl ? " and remove the published page from your Shopify store" : ""}.
                This cannot be undone.
              </Text>
              <TextField
                label={<>Type <strong>delete</strong> to confirm</>}
                value={deleteConfirmation}
                onChange={setDeleteConfirmation}
                autoComplete="off"
                placeholder="delete"
              />
            </BlockStack>
          </Modal.Section>
        </Modal>
      )}

      {/* Hidden delete form */}
      <Form method="post" id="delete-form" style={{ display: "none" }}>
        <input type="hidden" name="intent" value="delete" />
      </Form>
    </Page>
  );
}
