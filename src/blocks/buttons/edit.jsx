import {
  useBlockProps,
  RichText,
  BlockControls,
  InspectorControls,
  useBlockEditContext,
} from "@wordpress/block-editor";
import {
  ToolbarButton,
  ToolbarGroup,
  Dropdown,
  SelectControl,
  ComboboxControl,
  Button,
  PanelBody,
  BaseControl,
  ButtonGroup,
  ToggleControl,
  TextControl,
  Spinner,
  Modal,
  SearchControl,
  __experimentalToggleGroupControl as ToggleGroupControl,
  __experimentalToggleGroupControlOption as ToggleGroupControlOption,
} from "@wordpress/components";
// Icônes Lucide personnalisées (remplacent @wordpress/icons)
const LucideIcon = ({ children, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    {children}
  </svg>
);

const justifyLeft = (
  <LucideIcon>
    <path d="M4 6h16" />
    <path d="M4 12h10" />
    <path d="M4 18h14" />
  </LucideIcon>
);

const justifyCenter = (
  <LucideIcon>
    <path d="M4 6h16" />
    <path d="M7 12h10" />
    <path d="M5 18h14" />
  </LucideIcon>
);

const justifyRight = (
  <LucideIcon>
    <path d="M4 6h16" />
    <path d="M10 12h10" />
    <path d="M6 18h14" />
  </LucideIcon>
);

const justifySpaceBetween = (
  <LucideIcon>
    <path d="M4 6h16" />
    <path d="M4 12h16" />
    <path d="M4 18h16" />
  </LucideIcon>
);

const settingsIcon = (
  <LucideIcon>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </LucideIcon>
);

const trashIcon = (
  <LucideIcon>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </LucideIcon>
);
import { useState, useMemo, useEffect } from "@wordpress/element";
import { useSelect } from "@wordpress/data";
import { sprintf, _n } from "@wordpress/i18n";
import apiFetch from "@wordpress/api-fetch";

export default function Edit({ attributes, setAttributes, clientId }) {
  // DEBUG: Log au montage du composant
  console.log('[buttons-v2] Edit component mounted');
  console.log('[buttons-v2] attributes:', attributes);
  console.log('[buttons-v2] clientId:', clientId);
  console.log('[buttons-v2] window.siteforgeConfig:', window.siteforgeConfig);

  const {
    data = {
      settings: {
        justifyValue: "justify-start",
        flexWrap: true,
        gap: "1rem",
      },
      buttons: [],
    },
  } = attributes;

  // Fonction pour générer un ID unique basé sur le clientId du bloc et un timestamp
  const generateUniqueId = () => {
    return `${clientId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // S'assurer que tous les boutons existants ont un ID unique
  const ensureButtonIds = (buttonsArray) => {
    return buttonsArray.map((btn, index) => ({
      ...btn,
      id: btn.id || `${clientId}-btn-${index}-${Date.now()}`
    }));
  };

  const { settings: layoutSettings, buttons } = data;

  // State pour les styles de boutons récupérés depuis l'API
  const [buttonStyles, setButtonStyles] = useState([]);
  const [buttonStylesData, setButtonStylesData] = useState([]); // Garde les données complètes
  const [loadingStyles, setLoadingStyles] = useState(true);

  // State pour la modale d'icônes (au niveau parent pour éviter les problèmes de z-index)
  const [iconPickerState, setIconPickerState] = useState({
    isOpen: false,
    buttonIndex: null,
    currentValue: '',
  });
  const [lucideIcons, setLucideIcons] = useState([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  // URL du sprite Lucide
  const spriteUrl = window.siteforgeConfig?.spriteUrl || '';

  // Charger les icônes quand la modale s'ouvre
  useEffect(() => {
    if (iconPickerState.isOpen && lucideIcons.length === 0) {
      const fetchIcons = async () => {
        setLoadingIcons(true);
        try {
          const data = await apiFetch({ path: '/siteforge/v1/icons' });
          setLucideIcons(data.icons || []);
        } catch (error) {
          console.error('[buttons-v2] Erreur lors de la récupération des icônes:', error);
          setLucideIcons([]);
        } finally {
          setLoadingIcons(false);
        }
      };
      fetchIcons();
    }
  }, [iconPickerState.isOpen, lucideIcons.length]);

  // Fonctions pour la modale d'icônes
  const openIconPicker = (buttonIndex, currentValue) => {
    setIconSearchQuery("");
    setIconPickerState({ isOpen: true, buttonIndex, currentValue });
  };

  const closeIconPicker = () => {
    setIconPickerState({ isOpen: false, buttonIndex: null, currentValue: '' });
  };

  const handleIconSelect = (iconSlug) => {
    if (iconPickerState.buttonIndex !== null) {
      updateButton(iconPickerState.buttonIndex, "icon", iconSlug);
    }
    closeIconPicker();
  };

  // Vérifier et ajouter les IDs manquants aux boutons existants
  useEffect(() => {
    const buttonsNeedIds = buttons.some(btn => !btn.id);
    if (buttonsNeedIds && buttons.length > 0) {
      const buttonsWithIds = ensureButtonIds(buttons);
      setAttributes({
        data: {
          ...data,
          buttons: buttonsWithIds,
        },
      });
    }
  }, [clientId]); // Se déclenche si clientId change

  // Récupère dynamiquement les styles depuis la route WP REST API SiteForge
  useEffect(() => {
    const fetchStyles = async () => {
      console.log('[buttons-v2] Fetching button styles from API...');
      try {
        const styles = await apiFetch({ path: '/siteforge/v1/button-styles' });
        console.log('[buttons-v2] Button styles received:', styles);

        const styleOptions = styles.map((style) => ({
          label: style.variables?.title || style.label || style.name.replace(/^btn-/, "").replace(/-/g, " "),
          value: style.name,
        }));

        setButtonStyles(styleOptions);
        setButtonStylesData(styles); // Stocke les données complètes pour l'utilisation des variables
      } catch (error) {
        console.error("[buttons-v2] Erreur API button-styles:", error);
        setButtonStyles([{ label: "Primaire", value: "btn-primary" }]);
        setButtonStylesData([]);
      } finally {
        setLoadingStyles(false);
      }
    };

    fetchStyles();
  }, []);

  const updateSettings = (key, value) => {
    setAttributes({
      data: {
        ...data,
        settings: {
          ...layoutSettings,
          [key]: value,
        },
      },
    });
  };

  const updateButton = (index, key, value) => {
    const newButtons = [...buttons];
    
    // S'assurer que la structure link existe si on la modifie
    if (key === "link" && !newButtons[index].link) {
      newButtons[index].link = {
        url: "",
        title: "",
        target: "",
        type: "url",
        postId: 0,
        termId: 0,
        taxonomy: "",
        postType: "",
      };
    }
    
    newButtons[index][key] = value;
    setAttributes({
      data: {
        ...data,
        buttons: newButtons,
      },
    });
  };

  const addButton = () => {
    const defaultButtonType = buttonStyles.length ? buttonStyles[0].value : "btn-primary";
    const defaultIconPosition = getDefaultIconPosition(defaultButtonType);
    const defaultIcon = getDefaultIcon(defaultButtonType);
    
    setAttributes({
      data: {
        ...data,
        buttons: [
          ...buttons,
          {
            id: generateUniqueId(), // Ajout d'un ID unique
            title: "Texte du bouton",
            type: defaultButtonType,
            icon: defaultIcon, // Sera vide si pas d'icon-default définie
            icon_position: defaultIconPosition,
            link: {
              url: "",
              title: "",
              target: "",
              type: "url",
              postId: 0,
              termId: 0,
              taxonomy: "",
              postType: "",
            },
            class: "",
            download: false,
            data: {},
          },
        ],
      },
    });
  };

  const removeButton = (i) => {
    const newButtons = [...buttons];
    newButtons.splice(i, 1);
    setAttributes({
      data: {
        ...data,
        buttons: newButtons,
      },
    });
  };

  const decodeEntities = (html) => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  };

  // Fonction utilitaire pour récupérer les variables d'un style de bouton
  const getButtonStyleVariables = (buttonType) => {
    const styleData = buttonStylesData.find(style => style.name === buttonType);
    return styleData?.variables || {};
  };

  // Fonction utilitaire pour vérifier si une fonctionnalité est désactivée
  const isFeatureDisabled = (buttonType, featureName) => {
    const variables = getButtonStyleVariables(buttonType);
    return variables[featureName] === "false";
  };

  // Fonction utilitaire pour vérifier si les icônes sont autorisées
  const areIconsEnabled = (buttonType) => {
    const variables = getButtonStyleVariables(buttonType);
    // Si la variable n'existe pas, on garde le comportement par défaut (true)
    return variables["icon"] !== "false";
  };

  // Fonction utilitaire pour vérifier si le déplacement d'icône est autorisé
  const isIconMoveEnabled = (buttonType) => {
    const variables = getButtonStyleVariables(buttonType);
    // Si la variable n'existe pas, on garde le comportement par défaut (true)
    return variables["icon-move"] !== "false";
  };

  // Fonction utilitaire pour récupérer la position d'icône par défaut
  const getDefaultIconPosition = (buttonType) => {
    const variables = getButtonStyleVariables(buttonType);
    // Si la variable existe, on l'utilise, sinon on garde "after" par défaut
    return variables["icon-position"] || "after";
  };

  // Fonction utilitaire pour récupérer l'icône par défaut
  const getDefaultIcon = (buttonType) => {
    const variables = getButtonStyleVariables(buttonType);
    return variables["icon-default"] || "";
  };

  // Fonction utilitaire pour vérifier si une icône doit être affichée
  const shouldShowIcon = (btn) => {
    const variables = getButtonStyleVariables(btn.type);
    // Si les icônes sont désactivées mais qu'il y a une icône par défaut, on l'affiche
    if (variables["icon"] === "false" && variables["icon-default"]) {
      return true;
    }
    // Sinon, on affiche l'icône si les icônes sont autorisées et qu'il y a une icône
    return areIconsEnabled(btn.type) && btn.icon;
  };

  // Fonction utilitaire pour récupérer l'icône à afficher
  const getDisplayIcon = (btn) => {
    const variables = getButtonStyleVariables(btn.type);
    // Si les icônes sont désactivées mais qu'il y a une icône par défaut, on utilise celle-ci
    if (variables["icon"] === "false" && variables["icon-default"]) {
      return variables["icon-default"];
    }
    // Sinon, on utilise l'icône du bouton, ou l'icône par défaut si elle existe
    return btn.icon || (variables["icon-default"] ? variables["icon-default"] : "");
  };

  const PostSelector = ({ value, onChangeId, onChangeType }) => {
    const [query, setQuery] = useState("");
    
    const excludedTypes = [
      "post",
      "attachment",
      "wp_template_part",
      "wp_template",
      "nav_menu_item",
      "wp_navigation",
    ];

    const allTypes = useSelect(
      (select) => select("core").getPostTypes({ per_page: -1 }),
      [],
    );

    const allPosts = useSelect(
      (select) => {
        const postsByType = {};
        if (!allTypes) return {};
        allTypes.forEach((type) => {
          if (excludedTypes.includes(type.slug)) return;
          postsByType[type.slug] = select("core").getEntityRecords(
            "postType",
            type.slug,
            { per_page: -1 },
          );
        });
        return postsByType;
      },
      [allTypes],
    );

    const options = useMemo(() => {
      if (!allPosts || !allTypes) return [];

      let allOptions = [];
      allTypes.forEach((type) => {
        if (excludedTypes.includes(type.slug)) return;

        const posts = allPosts[type.slug];
        if (!posts || !Array.isArray(posts)) return;

        const filteredPosts = posts.filter((p) =>
          p && p.title && p.title.rendered && 
          p.title.rendered.toLowerCase().includes(query.toLowerCase()),
        );

        if (filteredPosts.length > 0) {
          allOptions.push({
            value: `__group_${type.slug}`,
            label: `--- ${type.labels.singular_name} ---`,
            disabled: true,
          });

          filteredPosts.forEach((p) => {
            allOptions.push({
              value: `${type.slug}|${p.id}`,
              label: decodeEntities(p.title?.rendered || p.title || `Post #${p.id}`),
            });
          });
        }
      });

      return allOptions;
    }, [allPosts, allTypes, query]);

    return (
      <ComboboxControl
        label="Sélectionner un contenu"
        value={value ? options.find(opt => opt.value.endsWith(`|${value}`))?.value || "" : ""}
        onChange={(val) => {
          if (!val || !val.includes('|')) return;
          
          const [type, id] = val.split("|");
          onChangeType(type);
          onChangeId(parseInt(id));
        }}
        onFilterValueChange={setQuery}
        options={options}
      />
    );
  };

  const ArchiveSelector = ({ postType, onChangeType }) => {
    const allTypes = useSelect(
      (select) => select("core").getPostTypes({ per_page: -1 }),
      [],
    );

    const options = useMemo(() => {
      if (!allTypes) return [];
      return allTypes
        .filter((t) => t.has_archive)
        .map((t) => ({
          value: t.slug,
          label: decodeEntities(t.labels.name),
        }));
    }, [allTypes]);

    return (
      <SelectControl
        label="Type de contenu (archive)"
        value={postType}
        options={[{ label: "Sélectionner...", value: "" }, ...options]}
        onChange={(val) => onChangeType(val)}
      />
    );
  };

  const TermSelector = ({ value, taxonomy, onChangeId, onChangeTaxo }) => {
    const [query, setQuery] = useState("");
    const excludedTaxonomies = ["category"];
    
    const allTaxonomies = useSelect(
      (select) => select("core").getTaxonomies({ per_page: -1 }),
      [],
    );

    const allTerms = useSelect(
      (select) => {
        const termsByTaxo = {};
        if (!allTaxonomies) return {};
        allTaxonomies.forEach((tax) => {
          if (excludedTaxonomies.includes(tax.slug)) return;
          termsByTaxo[tax.slug] = select("core").getEntityRecords(
            "taxonomy",
            tax.slug,
            { per_page: -1 },
          );
        });
        return termsByTaxo;
      },
      [allTaxonomies],
    );

    const options = useMemo(() => {
      if (!allTerms || !allTaxonomies) return [];

      let allOptions = [];
      allTaxonomies.forEach((taxo) => {
        if (excludedTaxonomies.includes(taxo.slug)) return;

        const terms = allTerms[taxo.slug];
        if (!terms || !Array.isArray(terms)) return;

        const filteredTerms = terms.filter((t) =>
          t && t.name && 
          t.name.toLowerCase().includes(query.toLowerCase()),
        );

        if (filteredTerms.length > 0) {
          allOptions.push({
            value: `__group_${taxo.slug}`,
            label: `--- ${taxo.labels.singular_name} ---`,
            disabled: true,
          });

          filteredTerms.forEach((t) => {
            allOptions.push({
              value: `${taxo.slug}|${t.id}`,
              label: decodeEntities(t.name || `Terme #${t.id}`),
            });
          });
        }
      });

      return allOptions;
    }, [allTerms, allTaxonomies, query]);

    return (
      <ComboboxControl
        label="Sélectionner un terme"
        value={value ? options.find(opt => opt.value.endsWith(`|${value}`))?.value || "" : ""}
        onChange={(val) => {
          if (!val || !val.includes('|')) return;
          
          const [taxo, id] = val.split("|");
          onChangeTaxo(taxo);
          onChangeId(parseInt(id));
        }}
        onFilterValueChange={setQuery}
        options={options}
      />
    );
  };

  // Composant simplifié de sélection d'icônes (la modale est rendue au niveau parent)
  const LucideIconPicker = ({ value, buttonIndex }) => {
    const currentIconPreview = value && spriteUrl ? (
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        style={{
          marginRight: "8px",
          fill: "none",
          stroke: "currentColor",
          strokeWidth: 2,
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }}
      >
        <use href={`${spriteUrl}#${value}`} />
      </svg>
    ) : null;

    return (
      <BaseControl label="Icône Lucide">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {currentIconPreview}
          <Button
            variant="secondary"
            onClick={() => openIconPicker(buttonIndex, value)}
            style={{ flex: 1 }}
          >
            {value ? `Changer l'icône (${value})` : "Ajouter une icône"}
          </Button>
          {value && (
            <Button
              isDestructive
              variant="secondary"
              onClick={() => updateButton(buttonIndex, "icon", "")}
              icon={trashIcon}
              label="Supprimer l'icône"
            />
          )}
        </div>
      </BaseControl>
    );
  };

  const nbBtn = buttons.length;

  return (
    <>
      <InspectorControls>
        <PanelBody title="Mise en page des boutons" initialOpen={true}>
          <BaseControl label="Alignement">
            <ButtonGroup>
              <Button
                icon={justifyLeft}
                label="Aligné à gauche"
                onClick={() => updateSettings("justifyValue", "justify-start")}
                isPressed={layoutSettings.justifyValue === "justify-start"}
                variant={
                  layoutSettings.justifyValue === "justify-start"
                    ? "primary"
                    : "secondary"
                }
              />
              <Button
                icon={justifyCenter}
                label="Centré"
                onClick={() => updateSettings("justifyValue", "justify-center")}
                isPressed={layoutSettings.justifyValue === "justify-center"}
                variant={
                  layoutSettings.justifyValue === "justify-center"
                    ? "primary"
                    : "secondary"
                }
              />
              <Button
                icon={justifyRight}
                label="Aligné à droite"
                onClick={() => updateSettings("justifyValue", "justify-end")}
                isPressed={layoutSettings.justifyValue === "justify-end"}
                variant={
                  layoutSettings.justifyValue === "justify-end"
                    ? "primary"
                    : "secondary"
                }
              />
              {nbBtn > 1 && (
                <Button
                  icon={justifySpaceBetween}
                  label="Espacé entre les boutons"
                  onClick={() =>
                    updateSettings("justifyValue", "justify-between")
                  }
                  isPressed={layoutSettings.justifyValue === "justify-between"}
                  variant={
                    layoutSettings.justifyValue === "justify-between"
                      ? "primary"
                      : "secondary"
                  }
                />
              )}
            </ButtonGroup>
          </BaseControl>
          {nbBtn > 1 && (
            <>
              <TextControl
                label="Gap entre les boutons"
                onChange={(val) => updateSettings("gap", val)}
                value={layoutSettings.gap}
              />
              <ToggleControl
                label="Retour à la ligne"
                checked={layoutSettings.flexWrap}
                onChange={(val) => updateSettings("flexWrap", val)}
              />
            </>
          )}
        </PanelBody>
      </InspectorControls>

      <div {...useBlockProps()}>
        <div
          className={`pib-buttons flex ${
            layoutSettings.flexWrap ? "flex-wrap" : ""
          } ${layoutSettings.justifyValue || ""}`}
          style={{ gap: layoutSettings.gap }}
        >
          {ensureButtonIds(buttons).map((btn, index) => (
            <div key={btn.id || `fallback-${index}`} className="pib-button-item">
              <BlockControls group="block">
                <ToolbarGroup>
                  <Dropdown
                    renderToggle={({ isOpen, onToggle }) => (
                      <ToolbarButton
                        icon={settingsIcon}
                        label={`Bouton "${btn.title}"`}
                        onClick={onToggle}
                        isPressed={isOpen}
                      />
                    )}
                    renderContent={() => (
                      <div style={{ padding: "0", minWidth: "260px" }}>
                        <PanelBody title="Lien du bouton" initialOpen={true}>
                          <SelectControl
                            label="Type de lien"
                            value={btn.link?.type || "url"}
                            options={[
                              { label: "URL personnalisée", value: "url" },
                              { label: "Contenu (pages / CPT)", value: "post" },
                              { label: "Archive (CPT)", value: "archive" },
                              { label: "Terme (taxonomies)", value: "term" },
                              { label: "Mail", value: "mail" },
                              { label: "Téléphone", value: "tel" },
                            ]}
                            onChange={(value) => {
                              const currentLink = btn.link || {};
                              updateButton(index, "link", { ...currentLink, type: value });
                              if (value === "mail")
                                updateButton(index, "link", { ...currentLink, url: "mailto:", type: value });
                              if (value === "tel")
                                updateButton(index, "link", { ...currentLink, url: "tel:", type: value });
                            }}
                          />

                          {/* champs du lien */}
                          {(btn.link?.type || "url") === "url" && (
                            <input
                              type="url"
                              value={btn.link?.url || ""}
                              placeholder="https://..."
                              style={{ width: "100%", marginTop: "10px" }}
                              onChange={(e) => {
                                const currentLink = btn.link || {};
                                updateButton(index, "link", { ...currentLink, url: e.target.value });
                              }}
                            />
                          )}
                          {(btn.link?.type || "url") === "mail" && (
                            <input
                              type="email"
                              value={(btn.link?.url || "").replace("mailto:", "")}
                              placeholder="email@example.com"
                              style={{ width: "100%", marginTop: "10px" }}
                              onChange={(e) => {
                                const currentLink = btn.link || {};
                                updateButton(
                                  index,
                                  "link",
                                  { ...currentLink, url: `mailto:${e.target.value}` }
                                );
                              }}
                            />
                          )}
                          {(btn.link?.type || "url") === "tel" && (
                            <input
                              type="tel"
                              value={(btn.link?.url || "").replace("tel:", "")}
                              placeholder="+33612345678"
                              style={{ width: "100%", marginTop: "10px" }}
                              onChange={(e) => {
                                const currentLink = btn.link || {};
                                updateButton(
                                  index,
                                  "link",
                                  { ...currentLink, url: `tel:${e.target.value}` }
                                );
                              }}
                            />
                          )}
                          {(btn.link?.type || "url") === "post" && (
                            <PostSelector
                              value={btn.link?.postId || 0}
                              onChangeId={(id) => {
                                const currentLink = btn.link || {};
                                const newLink = { ...currentLink, postId: id };
                                updateButton(index, "link", newLink);
                              }}
                              onChangeType={(type) => {
                                const currentLink = btn.link || {};
                                // Pour les posts individuels, on sauvegarde le type du post automatiquement
                                const newLink = { ...currentLink, postType: type };
                                updateButton(index, "link", newLink);
                              }}
                            />
                          )}
                          {(btn.link?.type || "url") === "archive" && (
                            <ArchiveSelector
                              postType={btn.link?.postType || ""}
                              onChangeType={(type) => {
                                const currentLink = btn.link || {};
                                updateButton(index, "link", { ...currentLink, postType: type });
                              }}
                            />
                          )}
                          {(btn.link?.type || "url") === "term" && (
                            <TermSelector
                              value={btn.link?.termId || 0}
                              taxonomy={btn.link?.taxonomy || ""}
                              onChangeId={(id) => {
                                const currentLink = btn.link || {};
                                const newLink = { ...currentLink, termId: id };
                                updateButton(index, "link", newLink);
                              }}
                              onChangeTaxo={(taxo) => {
                                const currentLink = btn.link || {};
                                const newLink = { ...currentLink, taxonomy: taxo };
                                updateButton(index, "link", newLink);
                              }}
                            />
                          )}
                          {/* Affichage conditionnel du contrôle target="_blank" */}
                          {!["mail", "tel"].includes(btn.link?.type || "url") && (
                            <div style={{ marginTop: "10px" }}>
                              <ToggleControl
                                label="Ouvrir dans un nouvel onglet"
                                checked={(btn.link?.target || "") === "_blank"}
                                onChange={(val) => {
                                  const currentLink = btn.link || {};
                                  updateButton(index, "link", { ...currentLink, target: val ? "_blank" : "" });
                                }}
                              />
                            </div>
                          )}
                        </PanelBody>

                        <PanelBody
                          title="Apparence du bouton"
                          initialOpen={true}
                        >
                          {loadingStyles ? (
                            <Spinner />
                          ) : (
                            <SelectControl
                              label="Style du bouton"
                              value={btn.type}
                              options={buttonStyles}
                              onChange={(value) => {
                                updateButton(index, "type", value);
                                // Mettre à jour la position d'icône selon le nouveau style
                                const defaultPos = getDefaultIconPosition(value);
                                updateButton(index, "icon_position", defaultPos);
                                // Mettre à jour l'icône par défaut si nécessaire
                                const defaultIcon = getDefaultIcon(value);
                                const variables = getButtonStyleVariables(value);
                                // Si les icônes sont désactivées mais qu'il y a une icône par défaut, on l'applique
                                if (variables["icon"] === "false" && variables["icon-default"]) {
                                  updateButton(index, "icon", defaultIcon);
                                } else if (!btn.icon && variables["icon-default"]) {
                                  // Si pas d'icône actuelle et qu'il y a une icône par défaut définie, l'appliquer
                                  updateButton(index, "icon", defaultIcon);
                                }
                              }}
                            />
                          )}

                          {/* Affichage conditionnel du sélecteur d'icône Lucide */}
                          {areIconsEnabled(btn.type) && (
                            <div style={{ marginTop: "16px" }}>
                              <LucideIconPicker
                                value={btn.icon || ""}
                                buttonIndex={index}
                              />
                            </div>
                          )}

                          {/* Affichage conditionnel de la position d'icône */}
                          {btn.icon && areIconsEnabled(btn.type) && isIconMoveEnabled(btn.type) && (
                            <div style={{ marginTop: "12px" }}>
                              <BaseControl label="Position de l'icône">
                                <ToggleGroupControl
                                  value={btn.icon_position || getDefaultIconPosition(btn.type)}
                                  onChange={(value) =>
                                    updateButton(index, "icon_position", value)
                                  }
                                  isBlock
                                >
                                  <ToggleGroupControlOption
                                    value="before"
                                    label="Avant le texte"
                                  />
                                  <ToggleGroupControlOption
                                    value="after"
                                    label="Après le texte"
                                  />
                                </ToggleGroupControl>
                              </BaseControl>
                            </div>
                          )}

                          {/* Messages informatifs si les fonctionnalités sont désactivées */}
                          {(!areIconsEnabled(btn.type) || !isIconMoveEnabled(btn.type)) && (
                            <div style={{ 
                              marginTop: "12px", 
                              padding: "8px", 
                              backgroundColor: "#f0f0f0", 
                              borderRadius: "4px",
                              fontSize: "12px",
                              color: "#666"
                            }}>
                              {!areIconsEnabled(btn.type) && (
                                <div>Les icônes sont désactivées pour ce style de bouton</div>
                              )}
                              {areIconsEnabled(btn.type) && !isIconMoveEnabled(btn.type) && (
                                <div>La position de l'icône est fixe pour ce style de bouton</div>
                              )}
                            </div>
                          )}
                        </PanelBody>
                      </div>
                    )}
                  />
                </ToolbarGroup>
              </BlockControls>

              <div className="pib-button-wrapper">
                <span className={`pib-button ${btn.type}`} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {shouldShowIcon(btn) && ((btn.icon_position || getDefaultIconPosition(btn.type)) === 'before') && (
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      <use href={`${window.siteforgeConfig?.spriteUrl || ''}#${getDisplayIcon(btn)}`} />
                    </svg>
                  )}
                  <RichText
                    tagName="span"
                    value={btn.title}
                    placeholder="Texte du bouton"
                    onChange={(value) => updateButton(index, "title", value)}
                    allowedFormats={[]}
                    withoutInteractiveFormatting
                  />
                  {shouldShowIcon(btn) && ((btn.icon_position || getDefaultIconPosition(btn.type)) === 'after') && (
                    <svg width="16" height="16" viewBox="0 0 24 24" style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
                      <use href={`${window.siteforgeConfig?.spriteUrl || ''}#${getDisplayIcon(btn)}`} />
                    </svg>
                  )}
                </span>

                <Button
                  isDestructive
                  onClick={() => removeButton(index)}
                  className="pib-remove-btn"
                  label="Supprimer"
                  showTooltip
                  icon={trashIcon}
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          variant="primary"
          onClick={addButton}
          style={{ marginTop: "12px" }}
        >
          + Ajouter un bouton
        </Button>
      </div>

      {/* Modale de sélection d'icônes (rendue au niveau racine pour éviter les problèmes de z-index) */}
      {iconPickerState.isOpen && (
        <Modal
          title="Sélectionner une icône Lucide"
          onRequestClose={closeIconPicker}
          className="sif-icon-picker-modal"
          overlayClassName="sif-icon-picker-overlay"
        >
          <div>
            <SearchControl
              value={iconSearchQuery}
              onChange={setIconSearchQuery}
              placeholder="Rechercher une icône..."
              style={{ marginBottom: "16px" }}
            />

            {iconSearchQuery && (
              <div style={{ marginBottom: "8px", fontSize: "12px", color: "#666" }}>
                {sprintf(
                  _n(
                    '%1$s résultat pour "%2$s"',
                    '%1$s résultats pour "%2$s"',
                    lucideIcons.filter(icon => icon.toLowerCase().includes(iconSearchQuery.toLowerCase())).length,
                    'siteforge'
                  ),
                  new Intl.NumberFormat("fr-FR").format(lucideIcons.filter(icon => icon.toLowerCase().includes(iconSearchQuery.toLowerCase())).length),
                  iconSearchQuery
                )}
              </div>
            )}

            {loadingIcons ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spinner />
                <p style={{ marginTop: "12px", color: "#666" }}>
                  Chargement des icônes...
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(50px, 1fr))",
                  gap: "4px",
                  maxHeight: "400px",
                  overflowY: "auto",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  padding: "12px",
                  width: "400px",
                }}>
                  {lucideIcons
                    .filter(icon => icon.toLowerCase().includes(iconSearchQuery.toLowerCase()))
                    .slice(0, 100)
                    .map((iconSlug) => (
                      <Button
                        key={iconSlug}
                        variant={iconPickerState.currentValue === iconSlug ? "primary" : "secondary"}
                        onClick={() => handleIconSelect(iconSlug)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "8px",
                          minHeight: "40px",
                          minWidth: "40px",
                        }}
                        title={iconSlug}
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          style={{
                            fill: "none",
                            stroke: "currentColor",
                            strokeWidth: 2,
                            strokeLinecap: "round",
                            strokeLinejoin: "round"
                          }}
                        >
                          <use href={`${spriteUrl}#${iconSlug}`} />
                        </svg>
                      </Button>
                    ))}
                </div>

                {lucideIcons.filter(icon => icon.toLowerCase().includes(iconSearchQuery.toLowerCase())).length > 100 && (
                  <p style={{ textAlign: "center", color: "#888", fontSize: "12px", marginTop: "12px" }}>
                    ... et {new Intl.NumberFormat("fr-FR").format(lucideIcons.filter(icon => icon.toLowerCase().includes(iconSearchQuery.toLowerCase())).length - 100)} autres résultats. Affinez votre recherche
                  </p>
                )}
              </>
            )}

            {!loadingIcons && lucideIcons.filter(icon => icon.toLowerCase().includes(iconSearchQuery.toLowerCase())).length === 0 && (
              <p style={{ textAlign: "center", color: "#666", marginTop: "20px" }}>
                Aucune icône trouvée pour "{iconSearchQuery}"
              </p>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}
