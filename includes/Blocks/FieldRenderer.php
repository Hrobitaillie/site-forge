<?php

/**
 * Field Renderer Class
 *
 * Converts fields.php definitions to block attributes and prepares data for JavaScript
 *
 * @package SiteForge\Blocks
 */

namespace SiteForge\Blocks;

// Exit if accessed directly
if (!defined('ABSPATH')) {
    exit;
}

/**
 * FieldRenderer class
 *
 * Responsible for converting field definitions to attributes and preparing for React
 */
class FieldRenderer {
    /**
     * Field type to attribute type mapping
     *
     * @var array
     */
    private $type_map = [
        'text'     => 'string',
        'textarea' => 'string',
        'wysiwyg'  => 'string',
        'image'    => 'string', // URL by default, can be 'number' for ID
        'select'   => 'string',
        'checkbox' => 'boolean',
        'repeater' => 'array',
        'group'    => 'object',
        'link'     => 'object', // Lien avancé avec mode, label, url/postId, target
        'icon'     => 'string', // Icon name from Lucide sprite
        'button'   => 'object', // Button field: link + icon + style
        'number'   => 'number',
        'url'      => 'string',
        'email'    => 'string',
        'color'    => 'string',
    ];

    /**
     * Convert fields to block attributes
     *
     * @param array $fields Field definitions from fields.php
     * @return array Block attributes schema
     */
    public function fields_to_attributes($fields) {
        $attributes = [];

        foreach ($fields as $name => $field) {
            $attributes[$name] = $this->field_to_attribute($field);
        }

        return $attributes;
    }

    /**
     * Convert single field to attribute schema
     *
     * @param array $field Field definition
     * @return array Attribute schema
     */
    private function field_to_attribute($field) {
        $type = $field['type'] ?? 'text';
        sif_log($field);
        $attribute = [
            'type' => $this->map_field_type_to_attribute_type($type, $field),
        ];

        // Add default value if provided
        if (isset($field['default'])) {
            $attribute['default'] = $field['default'];
        }

        // Handle special cases for repeater and group
        if ($type === 'repeater') {
            $attribute['default'] = $attribute['default'] ?? [];
        } elseif ($type === 'group') {
            $attribute['default'] = $attribute['default'] ?? [];
        }

        // Handle image with object return - needs default empty object
        // Note: Using stdClass for proper object serialization (not array)
        if ($type === 'image') {
            $return_value = $field['return_value'] ?? 'url';
            if ($return_value === 'object' && !isset($attribute['default'])) {
                $attribute['default'] = new \stdClass();
            }
        }

        return $attribute;
    }

    /**
     * Map field type to attribute type
     *
     * @param string $field_type Field type from fields.php
     * @param array  $field      Full field definition
     * @return string Attribute type
     */
    private function map_field_type_to_attribute_type($field_type, $field = []) {
        // Handle image field return value
        if ($field_type === 'image') {
            $return_value = $field['return_value'] ?? 'url';
            if ($return_value === 'id') {
                return 'number';
            } elseif ($return_value === 'object') {
                return 'object';
            }
            return 'string'; // url
        }

        return $this->type_map[$field_type] ?? 'string';
    }

    /**
     * Prepare fields for JavaScript
     *
     * @param array $fields Field definitions from fields.php
     * @return array Fields prepared for wp_localize_script
     */
    public function prepare_fields_for_js($fields) {
        $prepared_fields = [];

        foreach ($fields as $name => $field) {
            $prepared_fields[] = [
                'name'   => $name,
                'type'   => $field['type'] ?? 'text',
                'label'  => $field['label'] ?? ucfirst(str_replace('_', ' ', $name)),
                'config' => $field,
            ];
        }

        return $prepared_fields;
    }

    /**
     * Validate field definition
     *
     * @param array  $field Field definition
     * @param string $name  Field name
     * @return bool|string True if valid, error message if invalid
     */
    public function validate_field($field, $name) {
        // Field must be an array
        if (!is_array($field)) {
            return sprintf(__('Field "%s" must be an array', 'siteforge'), $name);
        }

        // Type is required
        if (empty($field['type'])) {
            return sprintf(__('Field "%s" is missing required "type" property', 'siteforge'), $name);
        }

        // Type must be valid
        if (!isset($this->type_map[$field['type']])) {
            return sprintf(
                __('Field "%s" has invalid type "%s"', 'siteforge'),
                $name,
                $field['type']
            );
        }

        // Validate repeater sub_fields
        if ($field['type'] === 'repeater') {
            if (empty($field['sub_fields']) || !is_array($field['sub_fields'])) {
                return sprintf(__('Repeater field "%s" must have sub_fields array', 'siteforge'), $name);
            }
        }

        // Validate group sub_fields
        if ($field['type'] === 'group') {
            if (empty($field['sub_fields']) || !is_array($field['sub_fields'])) {
                return sprintf(__('Group field "%s" must have sub_fields array', 'siteforge'), $name);
            }
        }

        // Validate select choices
        if ($field['type'] === 'select') {
            if (empty($field['choices']) || !is_array($field['choices'])) {
                return sprintf(__('Select field "%s" must have choices array', 'siteforge'), $name);
            }
        }

        // Allow filtering of validation
        $is_valid = apply_filters('siteforge/validate_field', true, $field, $name);

        return $is_valid;
    }

    /**
     * Get supported field types
     *
     * @return array Array of supported field types
     */
    public function get_supported_types() {
        return array_keys($this->type_map);
    }

    /**
     * Check if field type is supported
     *
     * @param string $type Field type to check
     * @return bool True if supported, false otherwise
     */
    public function is_type_supported($type) {
        return isset($this->type_map[$type]);
    }

    /**
     * Add custom field type
     *
     * @param string $type           Field type name
     * @param string $attribute_type Attribute type (string, number, boolean, array, object)
     * @return bool True if added, false if already exists
     */
    public function add_field_type($type, $attribute_type) {
        if (isset($this->type_map[$type])) {
            return false;
        }

        $this->type_map[$type] = $attribute_type;
        return true;
    }
}
