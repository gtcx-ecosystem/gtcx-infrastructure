package test

import (
	"testing"

	"github.com/gruntwork-io/terratest/modules/terraform"
	"github.com/stretchr/testify/assert"
)

// TestDatabaseModulePlan verifies the database module produces a valid
// Terraform plan with dual RDS instances (operational + audit).
// This test runs plan-only (no apply) to validate configuration without
// provisioning real infrastructure.
func TestDatabaseModulePlan(t *testing.T) {
	t.Parallel()

	terraformOptions := terraform.WithDefaultRetryableErrors(t, &terraform.Options{
		TerraformDir: ".",
		Vars: map[string]interface{}{
			"environment":             "test",
			"vpc_id":                  "vpc-test123",
			"subnet_ids":             []string{"subnet-a", "subnet-b"},
			"instance_class":          "db.t3.micro",
			"allocated_storage":       20,
			"multi_az":                false,
			"backup_retention_period": 1,
			"deletion_protection":     false,
			"allowed_security_groups": []string{},
		},
		NoColor:    true,
		PlanOnly:   true,
		NoColor:    true,
	})

	// Plan should succeed without errors
	plan := terraform.InitAndPlanAndShowWithStruct(t, terraformOptions)

	// Verify dual database resources are planned
	operationalDB := plan.ResourcePlannedValuesMap["aws_db_instance.operational"]
	auditDB := plan.ResourcePlannedValuesMap["aws_db_instance.audit"]

	assert.NotNil(t, operationalDB, "Operational DB should be in plan")
	assert.NotNil(t, auditDB, "Audit DB should be in plan")

	// Verify encryption is enabled on both
	assert.Equal(t, true, operationalDB.AttributeValues["storage_encrypted"])
	assert.Equal(t, true, auditDB.AttributeValues["storage_encrypted"])

	// Verify audit DB has deletion protection hardcoded to true
	assert.Equal(t, true, auditDB.AttributeValues["deletion_protection"])
}
