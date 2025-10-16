import pandas as pd
import numpy as np
import json
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers
import matplotlib.pyplot as plt
import seaborn as sns
from collections import deque
import random
import joblib

print("🤖 Building Reinforcement Learning Model for Vulnerability Scoring")
print("=" * 70)

# ========== 1. LOAD AND PREPARE DATA ==========
print("\n📊 Step 1: Loading Generated Data Files...")

# Load main datasets
admin_df = pd.read_csv('mock_administrative_hierarchy_mandla.csv')
beneficiary_df = pd.read_csv('mock_fra_beneficiaries_mandla.csv')
fra_titles_df = pd.read_csv('mock_fra_titles_mandla.csv')
asset_df = pd.read_csv('mock_detailed_asset_inventory_mandla.csv')
scheme_df = pd.read_csv('mock_css_scheme_coverage_mandla.csv')
change_df = pd.read_csv('mock_temporal_change_detection_mandla.csv')

# Load land cover stats if available
try:
    landcover_df = pd.read_csv('landcover_stats_mandla_gps.csv')
    print("   ✅ Land cover statistics loaded")
except:
    landcover_df = pd.DataFrame()
    print("   ⚠️ Land cover statistics not found")

print(f"   ✅ Loaded {len(beneficiary_df)} beneficiaries")

# ========== 2. FEATURE ENGINEERING ==========
print("\n🔧 Step 2: Engineering Features for RL Model...")

def create_comprehensive_features():
    """Create rich feature set for vulnerability assessment"""
    
    # Start with beneficiary base data
    ml_data = beneficiary_df.merge(admin_df, on='village_id', suffixes=('', '_admin'))
    
    # FRA Title Features
    title_summary = fra_titles_df.groupby('beneficiary_id').agg({
        'title_id': 'count',
        'area_hectares': ['sum', 'mean', 'max'],
        'status': lambda x: (x == 'Approved').sum()
    }).reset_index()
    title_summary.columns = ['beneficiary_id', 'total_titles', 'total_area', 
                             'avg_title_area', 'max_title_area', 'approved_titles']
    ml_data = ml_data.merge(title_summary, on='beneficiary_id', how='left').fillna(0)
    
    # Asset Features
    asset_summary = asset_df.groupby('beneficiary_id').agg({
        'asset_id': 'count',
        'area_hectares': ['sum', 'mean'],
        'verification_status': lambda x: (x == 'Verified').sum()
    }).reset_index()
    asset_summary.columns = ['beneficiary_id', 'total_assets', 'total_asset_area',
                            'avg_asset_area', 'verified_assets']
    ml_data = ml_data.merge(asset_summary, on='beneficiary_id', how='left').fillna(0)
    
    # Asset type distribution
    asset_types = asset_df.groupby(['beneficiary_id', 'asset_type']).size().unstack(fill_value=0)
    asset_types.columns = [f'assets_{col.lower()}' for col in asset_types.columns]
    ml_data = ml_data.merge(asset_types, on='beneficiary_id', how='left').fillna(0)
    
    # Scheme Coverage Features
    scheme_summary = scheme_df.groupby('beneficiary_id').agg({
        'eligible': 'sum',
        'covered': 'sum',
        'amount_received': ['sum', 'mean']
    }).reset_index()
    scheme_summary.columns = ['beneficiary_id', 'total_eligible', 'total_covered',
                             'total_amount', 'avg_amount']
    ml_data = ml_data.merge(scheme_summary, on='beneficiary_id', how='left').fillna(0)
    
    # Coverage gap metrics
    ml_data['scheme_gap'] = ml_data['total_eligible'] - ml_data['total_covered']
    ml_data['scheme_coverage_rate'] = ml_data['total_covered'] / (ml_data['total_eligible'] + 1)
    
    # Change Detection Features (temporal dynamics)
    change_summary = change_df.groupby('beneficiary_id').agg({
        'change_id': 'count',
        'area_change_hectares': 'sum',
        'change_type': lambda x: (x != 'No_Change').sum()
    }).reset_index()
    change_summary.columns = ['beneficiary_id', 'total_changes', 'total_area_change',
                             'significant_changes']
    ml_data = ml_data.merge(change_summary, on='beneficiary_id', how='left').fillna(0)
    
    # Land cover features (if available)
    if not landcover_df.empty:
        ml_data = ml_data.merge(
            landcover_df[['GP_Name', 'Forest_percent', 'Water_percent', 
                         'Built_up_percent', 'Vegetation_percent']],
            left_on='gp_name', right_on='GP_Name', how='left'
        ).fillna({'Forest_percent': 25.0, 'Water_percent': 5.0, 
                 'Built_up_percent': 5.0, 'Vegetation_percent': 40.0})
    
    # Derived vulnerability indicators
    ml_data['income_per_capita'] = ml_data['annual_income'] / ml_data['family_size']
    ml_data['asset_per_capita'] = ml_data['total_asset_area'] / ml_data['family_size']
    ml_data['title_approval_rate'] = ml_data['approved_titles'] / (ml_data['total_titles'] + 1)
    ml_data['benefit_per_capita'] = ml_data['total_amount'] / ml_data['family_size']
    
    return ml_data

feature_df = create_comprehensive_features()
print(f"   ✅ Created {len(feature_df.columns)} features")

# ========== 3. DEFINE RL ENVIRONMENT ==========
print("\n🎮 Step 3: Creating RL Environment...")

class VulnerabilityEnvironment:
    """
    Custom RL Environment for Vulnerability Assessment
    
    State: Beneficiary features
    Action: Predicted vulnerability score (0-100, discretized)
    Reward: Based on how well the score aligns with ground truth indicators
    """
    
    def __init__(self, data, features, n_actions=21):
        self.data = data.reset_index(drop=True)
        self.features = features
        self.n_actions = n_actions  # 21 bins: 0, 5, 10, ..., 100
        self.current_idx = 0
        self.scaler = StandardScaler()
        
        # Prepare features
        self.X = self.scaler.fit_transform(self.data[features].fillna(0))
        
        # Calculate ground truth vulnerability (composite score)
        self.ground_truth = self._calculate_ground_truth()
        
    def _calculate_ground_truth(self):
        """Calculate ground truth vulnerability from multiple indicators"""
        
        # Normalize components to 0-1 scale
        income_vuln = 1 - (self.data['annual_income'] / self.data['annual_income'].max())
        age_vuln = self.data['age'] / self.data['age'].max()
        
        # Family size vulnerability (inverted - smaller = more vulnerable)
        family_vuln = 1 - (self.data['family_size'] / self.data['family_size'].max())
        
        # Scheme gap (most important)
        scheme_vuln = self.data['scheme_gap'] / (self.data['total_eligible'] + 1)
        
        # Asset vulnerability (fewer/smaller assets = more vulnerable)
        asset_vuln = 1 - (self.data['total_asset_area'] / (self.data['total_asset_area'].max() + 1))
        
        # Title approval rate (lower = more vulnerable)
        title_vuln = 1 - self.data['title_approval_rate']
        
        # Weighted combination (matching original logic but normalized)
        vulnerability = (
            income_vuln * 0.25 +
            age_vuln * 0.10 +
            family_vuln * 0.10 +
            scheme_vuln * 0.35 +  # Highest weight
            asset_vuln * 0.15 +
            title_vuln * 0.05
        ) * 100
        
        return np.clip(vulnerability, 0, 100)
    
    def reset(self):
        """Reset to random beneficiary"""
        self.current_idx = np.random.randint(0, len(self.data))
        return self.X[self.current_idx]
    
    def step(self, action):
        """
        Take action (predict vulnerability score)
        
        Args:
            action: Index of vulnerability bin (0-20)
        
        Returns:
            next_state, reward, done, info
        """
        # Convert action to vulnerability score
        predicted_score = action * 5  # 0, 5, 10, ..., 100
        true_score = self.ground_truth[self.current_idx]
        
        # Calculate reward based on prediction accuracy
        error = abs(predicted_score - true_score)
        
        # Reward function: Higher reward for closer predictions
        if error <= 5:
            reward = 10  # Excellent prediction
        elif error <= 10:
            reward = 5   # Good prediction
        elif error <= 20:
            reward = 1   # Fair prediction
        else:
            reward = -error / 10  # Penalty for large errors
        
        # Bonus for correctly identifying high vulnerability cases
        if true_score >= 60 and predicted_score >= 60:
            reward += 5  # Critical to catch high-vulnerability cases
        
        # Move to next beneficiary
        self.current_idx = (self.current_idx + 1) % len(self.data)
        next_state = self.X[self.current_idx]
        
        # Episode done after processing all beneficiaries
        done = (self.current_idx == 0)
        
        info = {
            'true_score': true_score,
            'predicted_score': predicted_score,
            'error': error
        }
        
        return next_state, reward, done, info
    
    def get_state_dim(self):
        return self.X.shape[1]

# Select features for model
selected_features = [
    'age', 'family_size', 'annual_income', 'population', 'tribal_population',
    'forest_area_hectares', 'total_titles', 'total_area', 'approved_titles',
    'total_assets', 'total_asset_area', 'verified_assets', 'total_eligible', 
    'total_covered', 'total_amount', 'scheme_gap', 'scheme_coverage_rate',
    'total_changes', 'significant_changes', 'income_per_capita', 
    'asset_per_capita', 'title_approval_rate', 'benefit_per_capita'
]

# Add asset type features
for col in feature_df.columns:
    if col.startswith('assets_'):
        selected_features.append(col)

# Add land cover features if available
if 'Forest_percent' in feature_df.columns:
    selected_features.extend(['Forest_percent', 'Water_percent', 
                             'Built_up_percent', 'Vegetation_percent'])

# Encode categorical features
le_education = LabelEncoder()
le_occupation = LabelEncoder()
le_community = LabelEncoder()
feature_df['education_encoded'] = le_education.fit_transform(feature_df['education_level'])
feature_df['occupation_encoded'] = le_occupation.fit_transform(feature_df['occupation'])
feature_df['community_encoded'] = le_community.fit_transform(feature_df['tribal_community'])
selected_features.extend(['education_encoded', 'occupation_encoded', 'community_encoded'])

# Create environment
env = VulnerabilityEnvironment(feature_df, selected_features)
state_dim = env.get_state_dim()
action_dim = env.n_actions

print(f"   ✅ Environment created with {state_dim} state features and {action_dim} actions")

# ========== 4. BUILD DQN AGENT ==========
print("\n🧠 Step 4: Building Deep Q-Network (DQN) Agent...")

class DQNAgent:
    """Deep Q-Network Agent for Vulnerability Scoring"""
    
    def __init__(self, state_dim, action_dim, learning_rate=0.001):
        self.state_dim = state_dim
        self.action_dim = action_dim
        self.memory = deque(maxlen=10000)
        self.gamma = 0.95  # Discount factor
        self.epsilon = 1.0  # Exploration rate
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.learning_rate = learning_rate
        self.batch_size = 64
        
        # Build neural network
        self.model = self._build_model()
        self.target_model = self._build_model()
        self.update_target_model()
        
    def _build_model(self):
        """Build neural network for Q-value approximation"""
        model = keras.Sequential([
            layers.Input(shape=(self.state_dim,)),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(128, activation='relu'),
            layers.Dropout(0.2),
            layers.Dense(64, activation='relu'),
            layers.Dense(self.action_dim, activation='linear')
        ])
        model.compile(loss='mse', optimizer=keras.optimizers.Adam(lr=self.learning_rate))
        return model
    
    def update_target_model(self):
        """Copy weights from model to target_model"""
        self.target_model.set_weights(self.model.get_weights())
    
    def remember(self, state, action, reward, next_state, done):
        """Store experience in replay memory"""
        self.memory.append((state, action, reward, next_state, done))
    
    def act(self, state):
        """Choose action using epsilon-greedy policy"""
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_dim)
        
        q_values = self.model.predict(state.reshape(1, -1), verbose=0)
        return np.argmax(q_values[0])
    
    def replay(self):
        """Train on batch of experiences from memory"""
        if len(self.memory) < self.batch_size:
            return 0
        
        # Sample random batch
        minibatch = random.sample(self.memory, self.batch_size)
        
        states = np.array([exp[0] for exp in minibatch])
        actions = np.array([exp[1] for exp in minibatch])
        rewards = np.array([exp[2] for exp in minibatch])
        next_states = np.array([exp[3] for exp in minibatch])
        dones = np.array([exp[4] for exp in minibatch])
        
        # Predict Q-values
        q_values = self.model.predict(states, verbose=0)
        next_q_values = self.target_model.predict(next_states, verbose=0)
        
        # Update Q-values using Bellman equation
        for i in range(self.batch_size):
            if dones[i]:
                q_values[i][actions[i]] = rewards[i]
            else:
                q_values[i][actions[i]] = rewards[i] + self.gamma * np.max(next_q_values[i])
        
        # Train model
        loss = self.model.fit(states, q_values, epochs=1, verbose=0).history['loss'][0]
        
        # Decay exploration
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay
        
        return loss

agent = DQNAgent(state_dim, action_dim)
print(f"   ✅ DQN Agent initialized")

# ========== 5. TRAIN RL AGENT ==========
print("\n🏋️ Step 5: Training RL Agent...")

episodes = 50
update_target_frequency = 5
episode_rewards = []
episode_losses = []
episode_errors = []

for episode in range(episodes):
    state = env.reset()
    total_reward = 0
    total_loss = 0
    total_error = 0
    step_count = 0
    
    for step in range(len(feature_df)):
        # Agent selects action
        action = agent.act(state)
        
        # Environment responds
        next_state, reward, done, info = env.step(action)
        
        # Store experience
        agent.remember(state, action, reward, next_state, done)
        
        # Train agent
        loss = agent.replay()
        
        # Update metrics
        total_reward += reward
        total_loss += loss
        total_error += info['error']
        step_count += 1
        
        state = next_state
        
        if done:
            break
    
    # Update target network periodically
    if episode % update_target_frequency == 0:
        agent.update_target_model()
    
    # Record metrics
    avg_loss = total_loss / step_count if step_count > 0 else 0
    avg_error = total_error / step_count if step_count > 0 else 0
    episode_rewards.append(total_reward)
    episode_losses.append(avg_loss)
    episode_errors.append(avg_error)
    
    if (episode + 1) % 10 == 0:
        print(f"   Episode {episode+1}/{episodes} | "
              f"Reward: {total_reward:.1f} | "
              f"Avg Error: {avg_error:.2f} | "
              f"Epsilon: {agent.epsilon:.3f}")

print(f"   ✅ Training completed!")

# ========== 6. GENERATE PREDICTIONS ==========
print("\n🎯 Step 6: Generating Vulnerability Predictions...")

# Use trained agent to predict vulnerability scores
vulnerability_predictions = []
agent.epsilon = 0  # No exploration, only exploitation

for idx in range(len(feature_df)):
    state = env.X[idx]
    action = agent.act(state)
    predicted_score = action * 5  # Convert action to score
    true_score = env.ground_truth[idx]
    
    # Categorize
    if predicted_score < 30:
        category = 'Low'
    elif predicted_score < 60:
        category = 'Medium'
    else:
        category = 'High'
    
    vulnerability_predictions.append({
        'beneficiary_id': feature_df.iloc[idx]['beneficiary_id'],
        'rl_vulnerability_score': round(predicted_score, 1),
        'ground_truth_score': round(true_score, 1),
        'vulnerability_category': category,
        'prediction_error': abs(predicted_score - true_score)
    })

predictions_df = pd.DataFrame(vulnerability_predictions)

# Merge with original data
final_df = feature_df[['beneficiary_id', 'village_id', 'first_name', 'last_name', 
                       'age', 'family_size', 'annual_income', 'tribal_community']].merge(
    predictions_df, on='beneficiary_id'
)

# Save results
final_df.to_csv('rl_vulnerability_predictions_mandla.csv', index=False)
print(f"   ✅ Saved predictions for {len(final_df)} beneficiaries")

# ========== 7. SAVE MODEL AND ARTIFACTS ==========
print("\n💾 Step 7: Saving Models and Artifacts...")

# Save Keras model
agent.model.save('rl_vulnerability_model_mandla.h5')
print("   ✅ Saved Keras model: rl_vulnerability_model_mandla.h5")

# Save scaler and encoders
joblib.dump(env.scaler, 'rl_scaler_mandla.joblib')
joblib.dump(le_education, 'rl_le_education_mandla.joblib')
joblib.dump(le_occupation, 'rl_le_occupation_mandla.joblib')
joblib.dump(le_community, 'rl_le_community_mandla.joblib')
print("   ✅ Saved preprocessing artifacts")

# Save metadata
metadata = {
    'model_type': 'Deep Q-Network (DQN) for Vulnerability Scoring',
    'state_dim': state_dim,
    'action_dim': action_dim,
    'features': selected_features,
    'training_episodes': episodes,
    'final_epsilon': float(agent.epsilon),
    'avg_prediction_error': float(predictions_df['prediction_error'].mean()),
    'high_vulnerability_count': int((predictions_df['vulnerability_category'] == 'High').sum()),
    'medium_vulnerability_count': int((predictions_df['vulnerability_category'] == 'Medium').sum()),
    'low_vulnerability_count': int((predictions_df['vulnerability_category'] == 'Low').sum())
}

with open('rl_vulnerability_metadata_mandla.json', 'w') as f:
    json.dump(metadata, f, indent=2)
print("   ✅ Saved metadata")

# ========== 8. EVALUATION METRICS ==========
print("\n📈 Step 8: Evaluation Metrics...")

mae = predictions_df['prediction_error'].mean()
rmse = np.sqrt((predictions_df['prediction_error'] ** 2).mean())
accuracy_10 = (predictions_df['prediction_error'] <= 10).mean() * 100
accuracy_20 = (predictions_df['prediction_error'] <= 20).mean() * 100

print(f"\n   {'='*50}")
print(f"   MODEL PERFORMANCE METRICS")
print(f"   {'='*50}")
print(f"   Mean Absolute Error (MAE): {mae:.2f}")
print(f"   Root Mean Square Error (RMSE): {rmse:.2f}")
print(f"   Accuracy (±10 points): {accuracy_10:.1f}%")
print(f"   Accuracy (±20 points): {accuracy_20:.1f}%")
print(f"\n   VULNERABILITY DISTRIBUTION")
print(f"   {'='*50}")
print(f"   High Vulnerability: {metadata['high_vulnerability_count']} ({metadata['high_vulnerability_count']/len(predictions_df)*100:.1f}%)")
print(f"   Medium Vulnerability: {metadata['medium_vulnerability_count']} ({metadata['medium_vulnerability_count']/len(predictions_df)*100:.1f}%)")
print(f"   Low Vulnerability: {metadata['low_vulnerability_count']} ({metadata['low_vulnerability_count']/len(predictions_df)*100:.1f}%)")

# ========== 9. VISUALIZATIONS ==========
print("\n📊 Step 9: Creating Visualizations...")

fig, axes = plt.subplots(2, 3, figsize=(18, 10))
fig.suptitle('RL Model Training and Performance Analysis', fontsize=16, fontweight='bold')

# Training reward over episodes
axes[0, 0].plot(episode_rewards, linewidth=2, color='#2ecc71')
axes[0, 0].set_title('Training Rewards per Episode')
axes[0, 0].set_xlabel('Episode')
axes[0, 0].set_ylabel('Total Reward')
axes[0, 0].grid(True, alpha=0.3)

# Training loss over episodes
axes[0, 1].plot(episode_losses, linewidth=2, color='#e74c3c')
axes[0, 1].set_title('Training Loss per Episode')
axes[0, 1].set_xlabel('Episode')
axes[0, 1].set_ylabel('Average Loss')
axes[0, 1].grid(True, alpha=0.3)

# Prediction error over episodes
axes[0, 2].plot(episode_errors, linewidth=2, color='#3498db')
axes[0, 2].set_title('Prediction Error per Episode')
axes[0, 2].set_xlabel('Episode')
axes[0, 2].set_ylabel('Average Error')
axes[0, 2].grid(True, alpha=0.3)

# Predicted vs True scores scatter
axes[1, 0].scatter(predictions_df['ground_truth_score'], 
                   predictions_df['rl_vulnerability_score'],
                   alpha=0.5, s=20, color='#9b59b6')
axes[1, 0].plot([0, 100], [0, 100], 'r--', linewidth=2, label='Perfect Prediction')
axes[1, 0].set_title('Predicted vs Ground Truth')
axes[1, 0].set_xlabel('Ground Truth Score')
axes[1, 0].set_ylabel('Predicted Score')
axes[1, 0].legend()
axes[1, 0].grid(True, alpha=0.3)

# Error distribution
axes[1, 1].hist(predictions_df['prediction_error'], bins=30, 
                color='#e67e22', edgecolor='black', alpha=0.7)
axes[1, 1].set_title('Prediction Error Distribution')
axes[1, 1].set_xlabel('Absolute Error')
axes[1, 1].set_ylabel('Frequency')
axes[1, 1].axvline(mae, color='red', linestyle='--', linewidth=2, label=f'MAE: {mae:.2f}')
axes[1, 1].legend()
axes[1, 1].grid(True, alpha=0.3)

# Vulnerability category distribution
category_counts = predictions_df['vulnerability_category'].value_counts()
axes[1, 2].bar(category_counts.index, category_counts.values, 
               color=['#2ecc71', '#f39c12', '#e74c3c'], edgecolor='black', alpha=0.8)
axes[1, 2].set_title('Vulnerability Category Distribution')
axes[1, 2].set_xlabel('Category')
axes[1, 2].set_ylabel('Count')
axes[1, 2].grid(True, alpha=0.3, axis='y')

plt.tight_layout()
plt.savefig('rl_vulnerability_analysis_mandla.png', dpi=300, bbox_inches='tight')
print("   ✅ Saved visualization: rl_vulnerability_analysis_mandla.png")

print("\n" + "="*70)
print("🎉 REINFORCEMENT LEARNING MODEL TRAINING COMPLETE!")
print("="*70)
print("\n📁 Generated Files:")
print("   • rl_vulnerability_predictions_mandla.csv")
print("   • rl_vulnerability_model_mandla.h5")
print("   • rl_vulnerability_metadata_mandla.json")
print("   • rl_vulnerability_analysis_mandla.png")
print("   • rl_scaler_mandla.joblib")
print("   • rl_le_*.joblib (encoders)")
print("\n🚀 Model ready for deployment!")