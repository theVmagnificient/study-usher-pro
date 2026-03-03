/**
 * Demo Final Report: CT Chest — demonstrates sections (H1), blocks (H2),
 * red "normal" keywords, AI-modified green text, Impression numbering, spacing.
 */
export const demoReportCtChest = {
  protocol: `INDICATION:
Chronic lymphocytic leukemia (B-cell type).

COMPARISON:
No prior cross-sectional imaging available for comparison.

TECHNIQUE:
CT of the chest was performed without intravenous contrast.
Contiguous axial images with soft tissue and bone algorithms, with thin-slice axial and coronal reformations.
ALARA protocol.
Prior known CT or cardiac nuclear medicine studies performed in the last 12 months: 0`,

  findings: `FINDINGS:

Lungs and pleura:
Incomplete inspiration and gravitational changes make it difficult to determine parenchymal pathology, however, multiple subpleural areas of ground glass and reticulation are visualized.
In the basal and dorsal parts of the lungs (lower lobes) areas of subpleural honeycombing and traction bronchiolectasis, less than 10% of the lung parenchyma is involved.
No pulmonary nodules requiring follow-up.
Moderate mixed emphysema (centrilobular, paraseptal, in the lower lobes panlobular emphysema).
Pleural calcifications: right ventral pleura at the level of the middle lobe, dorsal and paramediastinal at the lower lobe level; left paramediastinal at the lower lobe level.
No pleural effusion.

Mediastinum and pulmonary hila:
No mediastinal or hilar adenopathy (lymph nodes up to 9 mm).
No mass.
Small sliding hiatal hernia.

Heart:
Mild cardiomegaly.
No clinically significant pericardial effusion.
Mild coronary artery calcifications.
Status post implantation of a leadless pacemaker.

Great vessels:
Thoracic aorta is not enlarged.
Main pulmonary artery is enlarged, 32 mm.

Chest wall and osseous structures:
Moderate degenerative thoracic spine changes.
Bone island of the left scapula (5 mm), mild degenerative changes in shoulder joints.`,

  impression: `IMPRESSION:
1. Usual interstitial pneumonia pattern (definite) according to Diagnostic HRCT criteria for UIP pattern - Fleischner society guideline 2018.
2. No pulmonary nodules requiring follow-up per Fleischner guidelines.
3. Moderate mixed emphysema.
4. Enlarged main pulmonary artery (32 mm), which may suggest pulmonary hypertension.
5. Pleural calcifications bilaterally as described; correlate with history to differentiate prior asbestos exposure versus healed infection involving the pleura.
6. Mild coronary artery calcifications.`
}

/** Sentences that simulate AI-generated modifications (green highlight in demo) */
export const demoAISentences = [
  'Incomplete inspiration and gravitational changes make it difficult to determine parenchymal pathology, however, multiple subpleural areas of ground glass and reticulation are visualized.',
  'In the basal and dorsal parts of the lungs (lower lobes) areas of subpleural honeycombing and traction bronchiolectasis, less than 10% of the lung parenchyma is involved.',
  'Main pulmonary artery is enlarged, 32 mm.',
  'Usual interstitial pneumonia pattern (definite) according to Diagnostic HRCT criteria for UIP pattern - Fleischner society guideline 2018.',
  'Enlarged main pulmonary artery (32 mm), which may suggest pulmonary hypertension.',
  'Pleural calcifications bilaterally as described; correlate with history to differentiate prior asbestos exposure versus healed infection involving the pleura.',
]

/** Keywords/phrases indicating normal findings — red until confirmed, then green */
export const normalKeywords = [
  'No clinically significant pericardial effusion',
  'No prior cross-sectional imaging available for comparison',
  'No pulmonary nodules requiring follow-up',
  'No mediastinal or hilar adenopathy',
  'No pulmonary nodules',
  'No pleural effusion',
  'not enlarged',
  'No mass',
  'No focal',
  'No acute',
  'No evidence',
  'в пределах нормы',
  'обычного диаметра',
  'без особенностей',
  'без очаговых',
  'не выявлено',
  'не выявлен',
  'не увеличены',
  'отсутствуют',
  'отсутствует',
  'сохранены',
  'свободны',
  'нормальных размеров',
]
