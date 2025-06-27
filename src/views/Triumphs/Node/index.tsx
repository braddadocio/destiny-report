import React from "react";
import { useDefinitions } from "../../../lib/definitions";

import Record from "../Record";
import {
  scoreFromRecord,
  useSettings,
  usePlayerData,
  calculateCompletedScoreFromNode,
} from "../common";
import s from "./styles.module.scss";
import cx from "classnames";
import { DestinyPresentationNodeDefinition } from "bungie-api-ts/destiny2/interfaces";
import {
  DestinyRecordDefinitionCollection,
  DestinyPresentationNodeDefinitionCollection,
} from "../../../lib/definitions/types";
import { useLocalStorage } from "../../../lib/hooks";
import Icon from "../../../components/Icon";

const scoreCache: Record<string, number> = {};
function scoreFromPresentationNode(
  node: DestinyPresentationNodeDefinition,
  nodeDefs: DestinyPresentationNodeDefinitionCollection,
  recordDefs: DestinyRecordDefinitionCollection
): number {
  if (scoreCache[node.hash]) {
    const cached = scoreCache[node.hash];
    return cached;
  }

  let score = 0;
  node.children?.presentationNodes.forEach(({ presentationNodeHash }) => {
    const childNode = nodeDefs[presentationNodeHash];
    score += childNode
      ? scoreFromPresentationNode(childNode, nodeDefs, recordDefs)
      : 0;
  });

  node.children?.records.forEach(({ recordHash }) => {
    const childRecord = recordDefs[recordHash];
    if (childRecord?.completionInfo?.toastStyle === 6) {
      score += 1;
    }
    score += childRecord ? scoreFromRecord(childRecord) : 0;
  });

  scoreCache[node.hash] = score;

  return score;
}

const Node: React.FC<{
  isRoot?: boolean;
  onClick?: (ev: React.MouseEvent) => void;
  onAddPlayer?: () => void;
  onRemovePlayer?: (membershipId: string) => void;
  presentationNodeHash: number;
}> = ({ isRoot, onClick, onAddPlayer, onRemovePlayer, presentationNodeHash }) => {
  const { showZeroPointTriumphs, showCompletedTriumphs } = useSettings();
  const playerData = usePlayerData();

  const {
    DestinyPresentationNodeDefinition: nodeDefs,
    DestinyRecordDefinition: recordDefs,
  } = useDefinitions();

  const [isCollapsed, setIsCollapsed] = useLocalStorage(
    `collapsed_${presentationNodeHash}`,
    false
  );

  const node = nodeDefs && nodeDefs[presentationNodeHash];

  if (!(node && nodeDefs && recordDefs)) {
    return null;
  }

  const totalChildrenPointScore =
    scoreFromPresentationNode(node, nodeDefs, recordDefs) || 0;

  if (!showZeroPointTriumphs && totalChildrenPointScore === 0) {
    return null;
  }

  const allZeroPointsRemaining = playerData.every((player) => {
    const completedScore = calculateCompletedScoreFromNode(
      node,
      player,
      nodeDefs,
      recordDefs
    );
    const remaining = totalChildrenPointScore - completedScore;

    return remaining <= 0;
  });

  if (
    !showCompletedTriumphs &&
    playerData.length > 0 &&
    allZeroPointsRemaining
  ) {
    return null;
  }

  const nodeSpan = (
    <>
      {node.displayProperties.name}
      <span className={s.nodePointScore}>
      {" - "}
      {totalChildrenPointScore.toLocaleString()} pts
      </span>
    </>
  );
  return node ? (
    <div className={cx(s.node, isCollapsed && s.isCollapsed)}>
      {false && !isRoot && (
        <div className={s.side}>
          <button
            className={s.collapseButton}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? "expand" : "collapse"}
          </button>
        </div>
      )}

      <div className={s.main}>
        <div className={cx(s.splitHeading, isRoot && s.sticky)}>
          <p
            className={cx(s.nodeHeading, s.pinnedLeft)}
            onClick={() => !isRoot && setIsCollapsed(!isCollapsed)}
          >
            {onClick && (
              <a
                className={s.nodeLink}
                href="#"
                title={'Click for options'}
                onClick={(ev) => {
                  ev.preventDefault();
                  ev.stopPropagation();
                  onClick(ev);
                }}>{nodeSpan}</a>
            ) || nodeSpan}
          </p>

          <NodePlayerData
            isRoot={isRoot}
            node={node}
            onRemovePlayer={isRoot && onClick && onRemovePlayer ? onRemovePlayer : undefined}
            totalChildrenPointScore={totalChildrenPointScore}
          />
          {isRoot && onAddPlayer && (
            <button
              className={s.addPlayerButton}
              onClick={(ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                onAddPlayer();
              }}
            >
              <div className={s.addPlayerButtonInner}>
                <Icon name="plus" />
              </div>
            </button>
          )}
        </div>

        {!isCollapsed && (
          <div className={s.nodeChildren}>
            {node.children?.presentationNodes.map((child) => (
              <Node
                key={child.presentationNodeHash}
                presentationNodeHash={child.presentationNodeHash}
              />
            ))}

            {node.children?.records.map((child) => (
              <Record key={child.recordHash} recordHash={child.recordHash} />
            ))}
          </div>
        )}
      </div>
    </div>
  ) : null;
};

const NodePlayerData: React.FC<{
  isRoot?: boolean;
  onRemovePlayer?: (membershipId: string) => void;
  node: DestinyPresentationNodeDefinition;
  totalChildrenPointScore: number;
}> = ({ isRoot, node, onRemovePlayer, totalChildrenPointScore }) => {
  const playerData = usePlayerData();

  const {
    DestinyPresentationNodeDefinition: nodeDefs,
    DestinyRecordDefinition: recordDefs,
  } = useDefinitions();

  if (!nodeDefs || !recordDefs) {
    return null;
  }

  return (
    <div className={s.players}>
      {playerData.map((player, index) => {
        if (!player?.profile?.data?.userInfo?.membershipId) {
          return undefined;
        }

        const key = player.profile.data.userInfo.membershipId;

        const completedScore = calculateCompletedScoreFromNode(
          node,
          player,
          nodeDefs,
          recordDefs
        );

        const remainingScore = totalChildrenPointScore - completedScore;

        return (
          <div className={s.player} key={key}>
            {isRoot && (
              <>
                <strong>{player.profile.data.userInfo.displayName}</strong>
                {onRemovePlayer && (
                  <>
                    {' '}
                    <button
                      className={s.playerRemoveButton}
                      onClick={() => onRemovePlayer(key)}>
                      <Icon name="times" />
                    </button>
                  </>
                )}
                <br />
              </>
            )}

            <PointsToggle
              completed={completedScore}
              remaining={remainingScore}
            />
          </div>
        );
      })}
    </div>
  );
};

const PointsToggle: React.FC<{
  completed: number;
  remaining: number;
}> = ({ completed, remaining }) => {
  const settings = useSettings();

  return (
    <span
      onClick={(ev) =>
        settings.setShowCompletedPoints(!settings.showCompletedPoints)
      }
    >
      {settings.showCompletedPoints ? (
        <span>{completed.toLocaleString()} pts completed</span>
      ) : (
        <span>{remaining.toLocaleString()} pts remaining</span>
      )}
    </span>
  );
};

export default Node;
