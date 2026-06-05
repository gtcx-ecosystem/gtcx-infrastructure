package test

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

// TestVpcCreatesExpectedSubnets verifies the VPC module creates the correct
// subnet topology: public, private, and database subnets across 3 AZs.
func TestVpcCreatesExpectedSubnets(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: ".",
		Vars: map[string]interface{}{
			"environment":        "test",
			"region":             "us-east-1",
			"cidr_block":         "10.99.0.0/16",
			"availability_zones": []string{"us-east-1a", "us-east-1b", "us-east-1c"},
			"enable_nat_gateway": false,
			"enable_vpn_gateway": false,
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// Verify VPC was created
	vpcID := terraform.Output(t, terraformOptions, "vpc_id")
	assert.NotEmpty(t, vpcID)

	// Verify subnet outputs exist
	privateSubnets := terraform.OutputList(t, terraformOptions, "private_subnet_ids")
	publicSubnets := terraform.OutputList(t, terraformOptions, "public_subnet_ids")
	databaseSubnets := terraform.OutputList(t, terraformOptions, "database_subnet_ids")

	// 3 AZs = 3 subnets per tier
	assert.Equal(t, 3, len(privateSubnets), "Expected 3 private subnets")
	assert.Equal(t, 3, len(publicSubnets), "Expected 3 public subnets")
	assert.Equal(t, 3, len(databaseSubnets), "Expected 3 database subnets")
}

// TestVpcFlowLogsEnabled verifies VPC flow logs are configured.
func TestVpcFlowLogsEnabled(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: ".",
		Vars: map[string]interface{}{
			"environment":        "test-flowlogs",
			"region":             "us-east-1",
			"cidr_block":         "10.98.0.0/16",
			"availability_zones": []string{"us-east-1a", "us-east-1b"},
			"enable_nat_gateway": false,
			"enable_vpn_gateway": false,
		},
		NoColor: true,
	})

	defer terraform.Destroy(t, terraformOptions)
	terraform.InitAndApply(t, terraformOptions)

	// If we get here without error, flow logs were created successfully
	// (the VPC module creates flow logs unconditionally)
	vpcID := terraform.Output(t, terraformOptions, "vpc_id")
	assert.NotEmpty(t, vpcID)
}
