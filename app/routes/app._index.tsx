import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, Link, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  InlineStack,
  EmptyState,
  ResourceList,
  ResourceItem,
  Badge,
  Icon,
  Box,
  Divider,
  Banner,
  ProgressBar,
} from "@shopify/polaris";
import { CheckCircleIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;

  const advertorials = await prisma.advertorial.findMany({
    where: { shop },
    orderBy: { createdAt: "desc" },
  });

  const shopHost = `https://${shop}`;
  const advertorialsWithUrls = advertorials.map((a) => ({
    ...a,
    livePageUrl: a.shopifyPageUrl
      ? a.shopifyPageUrl.startsWith("http")
        ? a.shopifyPageUrl
        : `${shopHost}${a.shopifyPageUrl.startsWith("/") ? "" : "/"}${a.shopifyPageUrl}`
      : null,
  }));

  return json({
    advertorials: advertorialsWithUrls,
    shop,
  });
};

export default function Index() {
  const { advertorials, shop } = useLoaderData<typeof loader>();
  const [setupDismissed, setSetupDismissed] = useState(false);

  const hasAdvertorials = advertorials.length > 0;
  const hasPublished = advertorials.some((a) => a.livePageUrl);

  // Setup steps
  const steps = [
    {
      id: "activate",
      label: "Activate Advertorial on your storefront",
      description:
        'Enable the app embed by clicking the button below, then click "Save" in the theme editor.',
      completed: false, // We can't detect this easily, so we leave it manual
      action: {
        content: "Activate app embed",
        url: `https://${shop}/admin/themes/current/editor?context=apps`,
        external: true,
      },
    },
    {
      id: "create",
      label: "Create your first advertorial",
      description:
        "Pick a product, choose a template style (Story or Listicle), and generate a high-converting advertorial page.",
      completed: hasAdvertorials,
      action: {
        content: "Create advertorial",
        url: "/app/new",
        external: false,
      },
    },
    {
      id: "publish",
      label: "Publish and share your advertorial",
      description:
        "Publish your advertorial as a live page on your store, then use the URL in your Meta, TikTok, or Google ads.",
      completed: hasPublished,
      action: hasAdvertorials && !hasPublished
        ? {
            content: "View advertorials",
            url: "/app/campaigns",
            external: false,
          }
        : undefined,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const progress = Math.round((completedCount / steps.length) * 100);
  const showSetup = !setupDismissed && completedCount < steps.length;

  return (
    <Page>
      <TitleBar title="Advertorial" />
      <BlockStack gap="600">
        {/* Welcome heading */}
        <Text variant="headingLg" as="h1">
          Get started with Advertorial!
        </Text>

        {/* Setup guide */}
        {showSetup && (
          <Card>
            <BlockStack gap="400">
              <InlineStack align="space-between" blockAlign="center">
                <Text variant="headingMd" as="h2">
                  Setup guide
                </Text>
                <Button
                  variant="plain"
                  onClick={() => setSetupDismissed(true)}
                >
                  Dismiss
                </Button>
              </InlineStack>

              <ProgressBar progress={progress} size="small" tone="primary" />
              <Text variant="bodySm" tone="subdued" as="p">
                {completedCount} of {steps.length} steps completed
              </Text>

              <BlockStack gap="0">
                {steps.map((step, index) => (
                  <div key={step.id}>
                    {index > 0 && <Divider />}
                    <Box paddingBlock="400">
                      <InlineStack gap="400" blockAlign="start" wrap={false}>
                        <Box>
                          {step.completed ? (
                            <Icon
                              source={CheckCircleIcon}
                              tone="success"
                            />
                          ) : (
                            <span
                              style={{
                                display: "inline-block",
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                border: "2px solid #8c9196",
                              }}
                            />
                          )}
                        </Box>
                        <BlockStack gap="200">
                          <Text
                            variant="bodyMd"
                            fontWeight="semibold"
                            as="h3"
                          >
                            {step.label}
                          </Text>
                          <Text variant="bodySm" tone="subdued" as="p">
                            {step.description}
                          </Text>
                          {step.action && !step.completed && (
                            <Box>
                              {step.action.external ? (
                                <Button
                                  url={step.action.url}
                                  target="_blank"
                                  variant="primary"
                                  size="slim"
                                >
                                  {step.action.content}
                                </Button>
                              ) : (
                                <Link to={step.action.url}>
                                  <Button variant="primary" size="slim">
                                    {step.action.content}
                                  </Button>
                                </Link>
                              )}
                            </Box>
                          )}
                          {step.completed && (
                            <Text variant="bodySm" tone="success" as="p">
                              Completed
                            </Text>
                          )}
                        </BlockStack>
                      </InlineStack>
                    </Box>
                  </div>
                ))}
              </BlockStack>
            </BlockStack>
          </Card>
        )}

        {/* Advertorials list / empty state */}
        <Card>
          <BlockStack gap="400">
            <InlineStack align="space-between" blockAlign="center">
              <Text variant="headingMd" as="h2">
                Your advertorials
              </Text>
              {hasAdvertorials && (
                <Link to="/app/new">
                  <Button variant="primary" size="slim">
                    Create advertorial
                  </Button>
                </Link>
              )}
            </InlineStack>

            {!hasAdvertorials ? (
              <EmptyState
                heading="Your advertorials will show here"
                action={{
                  content: "Create advertorial",
                  url: "/app/new",
                }}
                image="https://cdn.shopify.com/s/files/1/0757/9955/files/empty-state.svg"
              >
                <p>
                  This is where you'll create and manage advertorial pages
                  for different products.
                </p>
              </EmptyState>
            ) : (
              <ResourceList
                resourceName={{
                  singular: "advertorial",
                  plural: "advertorials",
                }}
                items={advertorials}
                renderItem={(item) => {
                  const {
                    id,
                    title,
                    productTitle,
                    template,
                    angle,
                    livePageUrl,
                    createdAt,
                  } = item;
                  return (
                    <ResourceItem
                      id={id}
                      url={`/app/${id}`}
                      accessibilityLabel={`View ${title}`}
                    >
                      <InlineStack
                        align="space-between"
                        blockAlign="center"
                      >
                        <BlockStack gap="200">
                          <Text
                            variant="bodyMd"
                            fontWeight="bold"
                            as="h3"
                          >
                            {title}
                          </Text>
                          <InlineStack gap="200">
                            <Text
                              variant="bodySm"
                              tone="subdued"
                              as="span"
                            >
                              {productTitle}
                            </Text>
                            <Badge>{template}</Badge>
                            <Badge tone="info">{angle}</Badge>
                            {livePageUrl ? (
                              <Badge tone="success">Published</Badge>
                            ) : (
                              <Badge tone="attention">Draft</Badge>
                            )}
                          </InlineStack>
                          <Text
                            variant="bodySm"
                            tone="subdued"
                            as="span"
                          >
                            Created{" "}
                            {new Date(createdAt).toLocaleDateString()}
                          </Text>
                        </BlockStack>
                        {livePageUrl && (
                          <Button
                            url={livePageUrl}
                            target="_blank"
                            variant="plain"
                          >
                            View page
                          </Button>
                        )}
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            )}
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
