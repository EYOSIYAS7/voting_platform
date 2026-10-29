'use client';

import React, { useState } from 'react';
import { OrganizationalUnit, UnitType } from '@/lib/types/api';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  FolderTree,
} from 'lucide-react';
import styles from './OrgUnitTree.module.css';

interface OrgUnitTreeProps {
  units: OrganizationalUnit[];
  onAddChild: (parentUnit: OrganizationalUnit) => void;
  onEdit: (unit: OrganizationalUnit) => void;
  onDelete: (unit: OrganizationalUnit) => void;
}

function getTypeBadgeClass(type: UnitType): string {
  switch (type) {
    case UnitType.DIRECTORATE:
    case UnitType.DEPUTY_DIRECTORATE:
      return styles.typeDirectorate;
    case UnitType.DIVISION:
      return styles.typeDivision;
    case UnitType.DEPARTMENT:
      return styles.typeDepartment;
    case UnitType.TEAM:
    case UnitType.BRANCH:
      return styles.typeTeam;
    default:
      return styles.typeOther;
  }
}

interface TreeNodeProps {
  unit: OrganizationalUnit;
  onAddChild: (parentUnit: OrganizationalUnit) => void;
  onEdit: (unit: OrganizationalUnit) => void;
  onDelete: (unit: OrganizationalUnit) => void;
}

function TreeNode({ unit, onAddChild, onEdit, onDelete }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = unit.children && unit.children.length > 0;

  return (
    <div className={styles.nodeItem}>
      <div className={styles.nodeCard}>
        <div className={styles.nodeLeft}>
          {hasChildren ? (
            <button
              type="button"
              className={styles.expandBtn}
              onClick={() => setIsExpanded((prev) => !prev)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className={styles.expandPlaceholder} />
          )}

          <span className={styles.nodeName}>{unit.name}</span>
          <span className={`${styles.typeBadge} ${getTypeBadgeClass(unit.unitType)}`}>
            {unit.unitType.replace('_', ' ')}
          </span>

          {unit.description && (
            <span className={styles.nodeDesc} title={unit.description}>
              {unit.description}
            </span>
          )}
        </div>

        <div className={styles.nodeActions}>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onAddChild(unit)}
            title={`Add child unit under ${unit.name}`}
          >
            <Plus size={13} />
            <span>Add Sub-Unit</span>
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => onEdit(unit)}
            title="Edit unit"
          >
            <Edit2 size={13} />
          </button>

          <button
            type="button"
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--color-danger)' }}
            onClick={() => onDelete(unit)}
            title="Delete unit"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className={styles.childrenContainer}>
          {unit.children!.map((child) => (
            <TreeNode
              key={child.id}
              unit={child}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function OrgUnitTree({ units, onAddChild, onEdit, onDelete }: OrgUnitTreeProps) {
  if (!units || units.length === 0) {
    return (
      <div className={styles.emptyTree}>
        <FolderTree size={32} style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
        <p style={{ margin: 0 }}>No organizational units defined for this organization.</p>
        <p style={{ margin: '0.25rem 0 0', opacity: 0.7, fontSize: '0.8rem' }}>
          Add your first top-level directorate or department above.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.treeRoot}>
      {units.map((unit) => (
        <TreeNode
          key={unit.id}
          unit={unit}
          onAddChild={onAddChild}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

